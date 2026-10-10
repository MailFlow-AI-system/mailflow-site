import { useEffect, useRef, useState } from 'react'

const sampleMessages = [
  {
    id: 'avery-launch',
    sender: 'Avery Chen',
    email: 'avery.chen@example.test',
    subject: 'Q4 launch outline',
    date: 'Today, 9:42 AM',
    body: 'Could we align on the launch calendar this week? I have updated the outline with the latest milestones.',
  },
  {
    id: 'mina-research',
    sender: 'Mina Patel',
    email: 'mina.patel@example.test',
    subject: 'Research interview notes',
    date: 'Yesterday, 4:18 PM',
    body: 'The customer interviews surfaced three onboarding themes. I added the notes for our next review.',
  },
  {
    id: 'jordan-invoice',
    sender: 'Jordan Lee',
    email: 'jordan.lee@example.test',
    subject: 'Invoice for October',
    date: 'Monday, 11:06 AM',
    body: 'Attached is the updated estimate for the workshop. Let me know if you have any questions.',
  },
]

type FocusTarget = 'reader' | 'inbox' | 'draft' | 'draft-trigger'

export default function WorkspacePreview() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftOpen, setDraftOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const focusTarget = useRef<FocusTarget | null>(null)
  const focusAfterInbox = useRef<string | null>(null)
  const messageButtons = useRef(new Map<string, HTMLButtonElement>())
  const searchInput = useRef<HTMLInputElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)
  const replyButton = useRef<HTMLButtonElement>(null)
  const replyTextarea = useRef<HTMLTextAreaElement>(null)

  const selectedMessage = sampleMessages.find((message) => message.id === selectedId)
  const normalizedSearch = search.trim().toLowerCase()
  const visibleMessages = sampleMessages.filter((message) =>
    `${message.sender} ${message.subject} ${message.body}`.toLowerCase().includes(normalizedSearch),
  )

  useEffect(() => {
    switch (focusTarget.current) {
      case 'reader':
        backButton.current?.focus()
        break
      case 'inbox':
        ;(messageButtons.current.get(focusAfterInbox.current ?? '') ?? searchInput.current)?.focus()
        break
      case 'draft':
        replyTextarea.current?.focus()
        break
      case 'draft-trigger':
        replyButton.current?.focus()
        break
    }

    focusTarget.current = null
  })

  const openMessage = (id: string) => {
    focusTarget.current = 'reader'
    focusAfterInbox.current = id
    setDraft('')
    setDraftOpen(false)
    setSelectedId(id)
  }

  const closeReader = () => {
    focusTarget.current = 'inbox'
    setDraftOpen(false)
    setSelectedId(null)
  }

  const openDraft = () => {
    focusTarget.current = 'draft'
    setDraftOpen(true)
  }

  const closeDraft = () => {
    focusTarget.current = 'draft-trigger'
    setDraftOpen(false)
  }

  return (
    <section
      aria-labelledby="workspace-preview-title"
      className="workspace-preview"
      id="workspace-preview"
    >
      <h2 className="workspace-label" id="workspace-preview-title">
        Interactive preview · Sample messages
      </h2>
      <p className="workspace-status" role="status" aria-live="polite">
        Illustrative preview. Nothing is sent or saved.
      </p>

      <div className="workspace-layout" data-view={selectedMessage ? 'reader' : 'inbox'}>
        <section aria-labelledby="workspace-inbox-title" className="workspace-inbox">
          <h3 id="workspace-inbox-title">Inbox</h3>
          <label className="workspace-search-label" htmlFor="workspace-search">
            Search sample messages
          </label>
          <input
            autoComplete="off"
            className="workspace-search"
            id="workspace-search"
            onChange={(event) => setSearch(event.currentTarget.value)}
            ref={searchInput}
            type="search"
            value={search}
          />

          {visibleMessages.length > 0 ? (
            <ul aria-label="Sample messages" className="workspace-message-list">
              {visibleMessages.map((message) => (
                <li key={message.id}>
                  <button
                    aria-controls="workspace-reader"
                    aria-expanded={selectedId === message.id}
                    aria-label={`Open message from ${message.sender}: ${message.subject}`}
                    className="workspace-message"
                    data-message-id={message.id}
                    onClick={() => openMessage(message.id)}
                    ref={(element) => {
                      if (element) {
                        messageButtons.current.set(message.id, element)
                      } else {
                        messageButtons.current.delete(message.id)
                      }
                    }}
                    type="button"
                  >
                    <span>{message.sender}</span>
                    <span>{message.subject}</span>
                    <span>{message.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="workspace-empty">No sample messages match your search.</p>
          )}
        </section>

        {!selectedMessage && (
          <div className="workspace-placeholder" aria-hidden="true">
            <strong>A conversation awaits.</strong>
            <p>Choose a sample message to read it, or find a thread with search.</p>
          </div>
        )}
        <article
          aria-label={selectedMessage ? undefined : 'Selected sample message'}
          aria-labelledby={selectedMessage ? 'workspace-reader-title' : undefined}
          className="workspace-reader"
          hidden={!selectedMessage}
          id="workspace-reader"
        >
          {selectedMessage && (
            <>
              <button
                className="workspace-back"
                onClick={closeReader}
                ref={backButton}
                type="button"
              >
                Back to inbox
              </button>
              <header className="workspace-reader-header">
                <h3 id="workspace-reader-title">{selectedMessage.subject}</h3>
                <p>
                  From {selectedMessage.sender} &lt;{selectedMessage.email}&gt;
                </p>
                <span>{selectedMessage.date}</span>
              </header>
              <p className="workspace-message-body">{selectedMessage.body}</p>

              {draftOpen ? (
                <div className="workspace-draft">
                  <label htmlFor="workspace-reply">Reply to {selectedMessage.sender}</label>
                  <textarea
                    id="workspace-reply"
                    onChange={(event) => setDraft(event.currentTarget.value)}
                    ref={replyTextarea}
                    value={draft}
                  />
                  <button onClick={closeDraft} type="button">
                    Close draft
                  </button>
                </div>
              ) : (
                <button onClick={openDraft} ref={replyButton} type="button">
                  Draft a reply
                </button>
              )}
            </>
          )}
        </article>
      </div>
    </section>
  )
}
