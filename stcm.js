/**
 * STCM operations
 */

import jBinary from 'jbinary'

function getByteLengthOfStringWithLength (s) {
  return s.len + 2
}

function getByteLengthOfMetadataEntry (entry) {
  return getByteLengthOfStringWithLength(entry.key) + getByteLengthOfStringWithLength(entry.value)
}

function getByteLengthOfMetadata (metadata) {
  var output = 2
  for (var i = 0; i < metadata.entries.length; i++) {
    output += getByteLengthOfMetadataEntry(metadata.entries[i])
  }
  return output
}

const CompositeTypeSets = {
  'jBinary.all': 'Stcm',
  'jBinary.littleEndian': true,

  // Metadata declarations
  StringWithLength: {
    len: 'uint16',
    str: ['string', 'len']
  },

  MetadataEntry: {
    key: 'StringWithLength',
    value: 'StringWithLength'
  },

  Metadata: {
    count: 'uint16',
    entries: ['array', 'MetadataEntry', 'count']
  },

  Section: {
    size: 'uint32',
    metadata: 'Metadata',
    body: ['blob', ctx => ctx.size - 4 - getByteLengthOfMetadata(ctx.metadata)]
  },

  Stcm: {
    signature: ['string', 4],
    headerSize: 'uint16',
    version: 'uint16',
    minReaderVersion: 'uint16',
    minWriterVersion: 'uint16',
    sectionCount: 'uint32',
    metadata: 'Metadata',
    sections: ['array', 'Section', 'sectionCount']
  }
}

const PoseMapTypeSet = {
  'jBinary.all': 'Poses',
  'jBinary.littleEndian': true,

  StringWithLength: CompositeTypeSets.StringWithLength,
  MetadataEntry: CompositeTypeSets.MetadataEntry,
  Metadata: CompositeTypeSets.Metadata,

  Pose: {
    x: 'float32',
    y: 'float32',
    yaw: 'float32'
  },

  PoseWithMetadata: {
    name: 'StringWithLength',
    tagCount: 'uint8',
    tags: ['array', 'StringWithLength', 'tagCount'],
    pose: 'Pose',
    flags: 'uint8',
    metadata: 'Metadata'
  },

  Poses: ['array', 'PoseWithMetadata']
}

const LineMapTypeSets = {
  'jBinary.all': 'Lines',
  'jBinary.littleEndian': true,

  StringWithLength: CompositeTypeSets.StringWithLength,
  MetadataEntry: CompositeTypeSets.MetadataEntry,
  Metadata: CompositeTypeSets.Metadata,

  Point: {
    x: 'float32',
    y: 'float32'
  },

  Line: {
    name: 'StringWithLength',
    start: 'Point',
    end: 'Point',
    metadata: 'Metadata'
  },

  'Lines': ['array', 'Line']
}

function parseMetadata (metadata) {
  const output = {}
  for (var i = 0; i < metadata.entries.length; i++) {
    output[metadata.entries[i].key.str] = metadata.entries[i].value.str
  }
  return output
}

function parsePose (pose) {
  return {
    name: pose.name.str,
    tags: pose.tags.map(tag => tag.str),
    pose: pose.pose,
    flags: pose.flags,
    metadata: parseMetadata(pose.metadata)
  }
}

function parsePoses (poses) {
  return poses.map(parsePose)
}

function parseLine (line) {
  return {
    name: line.name.str,
    start: line.start,
    end: line.end,
    metadata: parseMetadata(line.metadata)
  }
}

function parseLines (lines) {
  return lines.map(parseLine)
}

function decodeData (metadata, data) {
  return new Promise((resolve, reject) => {
    switch (metadata.type) {
      case 'vnd.slamtec.map-layer/vnd.grid-map+binary':  //基础地图数据
        resolve({
          dimension: {
            width: +metadata.dimension_width,
            height: +metadata.dimension_height
          },
          origin: {
            x: +metadata.origin_x,
            y: +metadata.origin_y
          },
          resolution: {
            x: +metadata.resolution_x,
            y: +metadata.resolution_y
          },
          data: Int8Array.from(data)
        })
        break
      case 'vnd.slamtec.map-layer/vnd.pose-map+binary': //地图里各种点位置信息（充电桩，兴趣点，历史轨迹点）
        jBinary.load(new Blob([data]), PoseMapTypeSet)
          .then(poses => resolve(parsePoses(poses.readAll())))
          .catch(err => reject(err))
        break
      case 'vnd.slamtec.map-layer/vnd.line-map+binary': //各种线（虚拟墙，虚拟轨道）
        // console.log('raw data', data)
        jBinary.load(new Blob([data]), LineMapTypeSets)
          .then(lines => resolve(parseLines(lines.readAll())))
          .catch(err => reject(err))
        break
      default:
        resolve(data)
        break
    }
  })
}

async function parseSection (section) {
  const output = {
    metadata: parseMetadata(section.metadata)
  }
  output.body = await decodeData(output.metadata, section.body)
  return output
}

async function parseCompositeMap (map) {
  const output = {
    metadata: parseMetadata(map.metadata),
    version: map.version,
    sections: []
  }

  for (var i = 0; i < map.sections.length; i++) {
    output.sections.push(await parseSection(map.sections[i]))
  }

  return output
}

export function loadCompositeMap (source) {
  return jBinary.load(source, CompositeTypeSets).then(jb => parseCompositeMap(jb.readAll()))
}
