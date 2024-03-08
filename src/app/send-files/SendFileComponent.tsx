"use client"

import { socket } from "@/socket/config";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SendFileComponent() {

    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session')

    const [receiveSessionConnected, setReceiveSessionConnected] = useState(0);
    const [sharedFiles, setSharedFiles] = useState<string[]>([]);
    const [shareProgress, setShareProgress] = useState(0);

    useEffect(() => {
        const receiverJoinSessionListener = (data: number) => {
            if (data > 1) setReceiveSessionConnected(data)
            else setReceiveSessionConnected(0)
        };
        socket.on("receiver-join-session", receiverJoinSessionListener);

        return () => {
            socket.off("receiver-join-session", receiverJoinSessionListener);
        };
    }, []);

    async function copySessionIdToClipboard() {
        await navigator.clipboard.writeText(sessionId)
        alert('ID da sessão copiado')
    }

    function shareFiles(e: any) {
        const file = e.target.files[0]
        console.log(file)

        if (!file) return

        const reader = new FileReader()

        reader.onload = ((e) => {
            let buffer = new Uint8Array(reader.result)

            const metadata = {
                filename: file.name,
                total_buffer_size: buffer.length,
                buffer_size: 1024
            }

            socket.emit("file-meta", {
                sessionId,
                metadata
            })

            socket.on("fs-share", () => {
                const chunk = buffer.slice(0, metadata.buffer_size)
                buffer = buffer.slice(metadata.buffer_size, buffer.length)
                
                const progress = (metadata.total_buffer_size - buffer.length) / (metadata.total_buffer_size) * 100
                setShareProgress(progress)

                if(chunk.length != 0){
                    socket.emit("file-raw", {
                        sessionId,
                        buffer:chunk
                    })
                }
            })

        })
        reader.readAsArrayBuffer(file)
    }


    return (
        <main className="container my-5">
            <h1>Compartilhe seus arquivos</h1>
            <h2 role="button" onClick={copySessionIdToClipboard}>ID da sessão:{sessionId}</h2>
            {receiveSessionConnected == 0
                ? <p>Aguardando alguém conectar em sua sessão para começar o compartilhamento</p>
                : <>
                    <label htmlFor="select-files" className="btn btn-primary mt-4">Selecionar Arquivos</label>
                    <input onChange={shareFiles} id="select-files" type="file" accept="*/image" className="d-none" />
                    {
                        sharedFiles.length == 0
                            ? <p className="text-secondary mt-4">Nenhum arquivo compartilhado até o momento</p>
                            : <div className="mt-4">
                                <h3 className="mt-4">Arquivos compartilhados:</h3>
                            </div>
                    }
                    <p>{shareProgress}</p>
                </>
            }
        </main >
    )


}
