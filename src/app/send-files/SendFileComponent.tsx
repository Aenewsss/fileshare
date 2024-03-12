"use client"

import { socket } from "@/socket/config";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SendFileComponent() {

    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session')

    const [receiveSessionConnected, setReceiveSessionConnected] = useState(0);
    const [sharedFiles, setSharedFiles] = useState<string[]>([]);
    const [shareProgress, setShareProgress] = useState({ progress: 0, file: '' });

    useEffect(() => {
        const receiverJoinSessionListener = (data: number) => {
            if (data > 1) setReceiveSessionConnected(data)
            else setReceiveSessionConnected(0)
        };
        socket.on("receiver-join-session", receiverJoinSessionListener);
        socket.on("leave-session", receiverJoinSessionListener);

        return () => {
            socket.off("receiver-join-session", receiverJoinSessionListener);
        };
    }, []);

    async function copySessionIdToClipboard() {
        await navigator.clipboard.writeText(sessionId!)
        alert('ID da sessão copiado')
    }

    function shareFiles(e: any) {
        const file = e.target.files[0]

        if (!file) return
        if (sharedFiles.find(el => el == file.name)) return alert('arquivo já foi enviado')

        const reader = new FileReader()

        reader.onload = ((e) => {
            let buffer = new Uint8Array(reader.result as any)

            setSharedFiles([...sharedFiles, file.name])

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
                setShareProgress({ progress: Math.round(progress), file: file.name })

                if (chunk.length != 0) {
                    socket.emit("file-raw", {
                        sessionId,
                        buffer: chunk
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
                        sharedFiles.length == 0 && <p className="text-secondary mt-4">Nenhum arquivo compartilhado até o momento</p>
                    }

                    <div className="d-flex gap-5 flex-wrap">
                        {sharedFiles.map((file, index) =>
                            <div  style={{ width: 200 }} className="mt-4 border position-relative">
                                <div className="d-flex flex-column align-items-center  p-3 ">
                                    <Image width={64} height={64} src="/icons/file.svg" alt="File icon" />
                                    <p className="text-center mt-4">{file}</p>
                                </div>
                                {
                                    (shareProgress.file == file && shareProgress.progress < 100) &&
                                    <div className="bg-body-secondary opacity-75 position-absolute w-100 h-100 top-0 d-flex justify-content-center align-items-center">
                                        <p className="fs-3 fw-semibold">{shareProgress.progress}%</p>
                                    </div>
                                }
                            </div>
                        )}
                    </div>
                </>
            }
        </main >
    )


}
