// Not yet rebuilt to the nesbah.net design, and its markup assumes LTR. It opts
// out of the document's RTL direction until it is redesigned alongside the rest
// of the customer-facing surface.
export default function FindTemplatesLayout({ children }) {
    return <div dir="ltr">{children}</div>
}
