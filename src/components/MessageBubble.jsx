export default function MessageBubble({ who = 'bot', children }) {
    return (
        <div className={`bubble ${who}`}>{children}</div>
    )
}
