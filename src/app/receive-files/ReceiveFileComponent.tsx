"use client"

import { socket } from "@/socket/config";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReceiveFileComponent() {

    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session')

    let fileShare: any = {
        metadata: null, transmitted: 0, buffer: [], progress: 0
    }

    useEffect(() => {

        const receiverMetadataListener = (metadata: any) => {
            console.log(metadata)
            socket.emit("fs-start", sessionId)
            fileShare = { metadata, transmitted: 0, buffer: [], progress: 0 }
        }

        const receiverShareListener = (buffer: any) => {
            fileShare.buffer.push(buffer)
            fileShare.transmitted += buffer.byteLength
            fileShare.progress = (fileShare.transmitted / fileShare.metadata.total_buffer_size) * 100

            if (fileShare.transmitted == fileShare.metadata?.total_buffer_size) {
                const blob = new Blob(fileShare.buffer)
                const url = URL.createObjectURL(blob)

                const link = document.createElement("a");
                link.href = url;
                link.download = fileShare.metadata.filename;
                document.body.appendChild(link);
                link.click();
        
                URL.revokeObjectURL(url);
                document.body.removeChild(link);

                fileShare = {
                    metadata: null, 
                    transmitted: 0, 
                    buffer: [], 
                    progress: 0
                }

            } else socket.emit("fs-start", sessionId)
        }

        socket.on("fs-meta", receiverMetadataListener)
        socket.on("fs-share", receiverShareListener)

        return () => {
            socket.off("fs-meta", receiverMetadataListener)
            socket.off("fs-share", receiverShareListener)
        }

    }, []);

    return (
        <main className="container my-5">
            <h1>Arquivos compartilhados:</h1>
        </main >
    )
}