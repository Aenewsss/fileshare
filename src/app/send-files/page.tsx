
import { Suspense } from "react"
import SendFileComponent from "./SendFileComponent"

export default async function Page() {

    return (
        <Suspense>
            <SendFileComponent />
        </Suspense>
    )
}