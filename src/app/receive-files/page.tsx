import { Suspense } from "react"
import ReceiveFileComponent from "./ReceiveFileComponent"

export default async function Page() {

    return (
        <Suspense>
            <ReceiveFileComponent />
        </Suspense>
    )
}