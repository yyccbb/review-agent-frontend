import { useEffect, useRef } from 'react'


const EXAMPLE = {
    user_id: "112641626927833880743",
    name: "Little Man",
    time: 1533121309821,
    rating: 3,
    text: "Has nice food choices.",
    pics: [
        { url: ["https://lh5.googleusercontent.com/p/AF1QipMDSa1pSffRzM1AqS0phG3a_K2eSssz-vRY-cPf=w150-h150-k-no-p"] }
    ]
}


export default function JsonEditor({ value, onChange }) {
    const ref = useRef(null)
    useEffect(() => { if (ref.current && value == null) onChange(JSON.stringify(EXAMPLE, null, 2)) }, [])


    return (
        <textarea
            ref={ref}
            className="card mono grow"
            rows={10}
            spellCheck={false}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder='Paste a single Google review JSON object here...'
        />
    )
}
