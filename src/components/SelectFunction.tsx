"use client"

import { PathEnum } from "@/enums/path.enum";
import { socket } from "@/socket/config";
import { generateSessionId } from "@/utils/generate-session-id.util";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SelectFunction() {

    const router = useRouter()

    const [sessionId, setSessionId] = useState<string>('');

    useEffect(() => {

        const receiverJoinErrorListener = (data: string) => {
            alert(data);
        };

        const receiverJoinSuccessListener = (data: string) => {
            router.push('/receive-files')
        };

        socket.on("receiver-join-error", receiverJoinErrorListener);
        socket.on("receiver-join-success", receiverJoinSuccessListener);

        return () => {
            socket.off("receiver-join-error", receiverJoinErrorListener);
            socket.off("receiver-join-success", receiverJoinSuccessListener);
        };
    }, []);

    function connectSession() {
        socket.emit('receiver-join', sessionId)
    }

    function createSession() {
        const id = generateSessionId();
        socket.emit('sender-join', id);
        router.push(`/send-files?session=${id}`)
    }

    return (
        <div className="d-flex flex-column gap-3">
            <button onClick={createSession} className="rounded-pill btn btn-primary fs-4">Iniciar sessão</button>
            <div className="position-relative form-floating mb-3">
                <input
                    type="number"
                    className="rounded-pill border-black form-control"
                    name="sessionId"
                    id="sessionId"
                    placeholder=""
                    required
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                />
                <label htmlFor="sessionId">Insira o ID de uma sessão</label>
                <button onClick={connectSession} className="btn btn-default p-0 position-absolute end-0 top-0 fs-5 me-2 mt-3">↗️</button>
            </div>

        </div>
    )
}