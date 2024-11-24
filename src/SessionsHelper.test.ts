import { SessionsHelper } from './SessionsHelper'
import { SavedSessionsDescriptor } from './types'

describe('SessionsHelper', () => {
  const url = 'https://example.com'
  describe('3c3f: Moves tab', () => {
    describe('30bc: Same session', () => {
      const createSessions = (): SavedSessionsDescriptor => ({
        windows: [{ session_id: '1', title: '' }],
        tabs: [
          { session_id: '1', id: '1.0', index: 0, url },
          { session_id: '1', id: '1.1', index: 1, url },
          { session_id: '1', id: '1.2', index: 2, url },
          { session_id: '1', id: '1.3', index: 3, url },
        ],
      })

      it('c8d3: Up', () => {
        const sessions = createSessions()
        const helper = new SessionsHelper(sessions)
        helper.moveTab('1.1', '1', 2)
        expect(helper.data.tabs).toStrictEqual([
          { session_id: '1', id: '1.0', index: 0, url },
          { session_id: '1', id: '1.2', index: 1, url },
          { session_id: '1', id: '1.1', index: 2, url },
          { session_id: '1', id: '1.3', index: 3, url },
        ])
      })
      it('a5d4: Down', () => {
        const sessions = createSessions()
        const helper = new SessionsHelper(sessions)
        helper.moveTab('1.2', '1', 1)
        expect(helper.data.tabs).toStrictEqual([
          { session_id: '1', id: '1.0', index: 0, url },
          { session_id: '1', id: '1.2', index: 1, url },
          { session_id: '1', id: '1.1', index: 2, url },
          { session_id: '1', id: '1.3', index: 3, url },
        ])
      })
      it('67b9: At undefined index', () => {
        const sessions = createSessions()
        const helper = new SessionsHelper(sessions)
        helper.moveTab('1.2', '1')
        expect(helper.data.tabs).toStrictEqual([
          { session_id: '1', id: '1.0', index: 0, url },
          { session_id: '1', id: '1.1', index: 1, url },
          { session_id: '1', id: '1.3', index: 2, url },
          { session_id: '1', id: '1.2', index: 3, url },
        ])
      })
    })

    describe('974e: Different session', () => {
      const createSessions = (): SavedSessionsDescriptor => ({
        windows: [
          { session_id: '1', title: '' },
          { session_id: '2', title: '' },
        ],
        tabs: [
          { session_id: '1', id: '1.0', index: 0, url },
          { session_id: '1', id: '1.1', index: 1, url },
          { session_id: '1', id: '1.2', index: 2, url },
          { session_id: '1', id: '1.3', index: 3, url },

          { session_id: '2', id: '2.0', index: 0, url },
          { session_id: '2', id: '2.1', index: 1, url },
          { session_id: '2', id: '2.2', index: 2, url },
          { session_id: '2', id: '2.3', index: 3, url },
        ],
      })

      it('e32d: Moves', () => {
        const sessions = createSessions()
        const helper = new SessionsHelper(sessions)
        helper.moveTab('1.1', '2', 2)
        expect(helper.data.tabs).toStrictEqual([
          { session_id: '1', id: '1.0', index: 0, url },
          { session_id: '1', id: '1.2', index: 2, url },
          { session_id: '1', id: '1.3', index: 3, url },

          { session_id: '2', id: '2.0', index: 0, url },
          { session_id: '2', id: '2.1', index: 1, url },
          { session_id: '2', id: '1.1', index: 2, url },
          { session_id: '2', id: '2.2', index: 3, url },
          { session_id: '2', id: '2.3', index: 4, url },
        ])
      })
      it('fab5: Appends', () => {
        const sessions = createSessions()
        const helper = new SessionsHelper(sessions)
        helper.moveTab('1.1', '2')
        expect(helper.data.tabs).toStrictEqual([
          { session_id: '1', id: '1.0', index: 0, url },
          { session_id: '1', id: '1.2', index: 2, url },
          { session_id: '1', id: '1.3', index: 3, url },

          { session_id: '2', id: '2.0', index: 0, url },
          { session_id: '2', id: '2.1', index: 1, url },
          { session_id: '2', id: '2.2', index: 2, url },
          { session_id: '2', id: '2.3', index: 3, url },
          { session_id: '2', id: '1.1', index: 4, url },
        ])
      })
      it('3eb7: Clears session if tab was the last', () => {
        const sessions: SavedSessionsDescriptor = {
          windows: [
            { session_id: '1', title: '' },
            { session_id: '2', title: '' },
          ],
          tabs: [
            { session_id: '1', id: '1.0', index: 0, url },

            { session_id: '2', id: '2.0', index: 0, url },
            { session_id: '2', id: '2.1', index: 1, url },
            { session_id: '2', id: '2.2', index: 2, url },
            { session_id: '2', id: '2.3', index: 3, url },
          ],
        }
        const helper = new SessionsHelper(sessions)
        helper.moveTab('1.0', '2', 2)
        expect(helper.data).toStrictEqual({
          windows: [{ session_id: '2', title: '' }],
          tabs: [
            { session_id: '2', id: '2.0', index: 0, url },
            { session_id: '2', id: '2.1', index: 1, url },
            { session_id: '2', id: '1.0', index: 2, url },
            { session_id: '2', id: '2.2', index: 3, url },
            { session_id: '2', id: '2.3', index: 4, url },
          ],
        })
      })
    })
  })

  describe('73ca: Copy tab', () => {
    it('ce7c: Copies to another session', () => {
      // todo: implement
    })
    it('5750: Copies to same session', () => {
      // todo: implement
    })
  })

  describe('65d6: Add tab', () => {
    it('4bcf: Adds tab', () => {
      // todo: implement
    })
  })

  describe('7cf3: Remove tab', () => {
    it('9a08: Removes tab', () => {
      // todo: implement
    })
  })

  describe('0477: Remove session', () => {
    it('4e93: Removes session', () => {
      // todo: implement
    })
  })

  describe('b031: Rename session', () => {
    it('0a16: Renames session', () => {
      // todo: implement
    })
  })

  describe('f28d: Add session', () => {
    it('ddb6: Adds session', () => {
      // todo: implement
    })
  })
})
