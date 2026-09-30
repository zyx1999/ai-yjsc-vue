import { createFrameBuffer, parseFrame } from '@/utils/sseParser'

describe('Utils:sseParser', () => {
  it('parses a complete frame', () => {
    const buffer = createFrameBuffer()
    const frames = buffer.push('event: run.started\ndata: {"type":"run.started","sequence":1}\n\n')
    expect(frames.length).toBe(1)
    expect(frames[0].event).toBe('run.started')
    expect(JSON.parse(frames[0].data).sequence).toBe(1)
  })

  it('keeps partial frame across chunks', () => {
    const buffer = createFrameBuffer()
    expect(buffer.push('event: run.progress\ndata: {"a":').length).toBe(0)
    const frames = buffer.push('1}\n\n')
    expect(frames.length).toBe(1)
    expect(frames[0].event).toBe('run.progress')
    expect(frames[0].data).toBe('{"a":1}')
  })

  it('handles CRLF split across chunks', () => {
    const buffer = createFrameBuffer()
    expect(buffer.push('data: x\r').length).toBe(0)
    const frames = buffer.push('\n\r\n')
    expect(frames.length).toBe(1)
    expect(frames[0].data).toBe('x')
  })

  it('joins multiple data lines', () => {
    const frame = parseFrame('event: message\ndata: line1\ndata: line2')
    expect(frame.event).toBe('message')
    expect(frame.data).toBe('line1\nline2')
  })

  it('ignores comment frames', () => {
    expect(parseFrame(': connected')).toBeNull()
  })

  it('parses multiple frames in one chunk', () => {
    const buffer = createFrameBuffer()
    const frames = buffer.push('event: a\ndata: 1\n\nevent: b\ndata: 2\n\n')
    expect(frames.map(item => item.event)).toEqual(['a', 'b'])
  })

  it('keeps data values containing colons', () => {
    const frame = parseFrame('data: {"url":"http://x/a:b"}')
    expect(frame.data).toBe('{"url":"http://x/a:b"}')
  })
})
