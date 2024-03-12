"use client"

import { PathEnum } from "@/enums/path.enum";
import { socket } from "@/socket/config";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReceiveFileComponent() {
    const router = useRouter()
    
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session");

    const [fileShare, setFileShare] = useState<any>({
        metadata: null,
        transmitted: 0,
        buffer: [],
    });

    const [receivedFiles, setReceivedFiles] = useState<string[]>([]);
    const [receiveProgress, setReceiveProgress] = useState({ progress: 0, file: "" });

    useEffect(() => {
        const receiverMetadataListener = (metadata: any) => {
            socket.emit("fs-start", sessionId);
            setFileShare({ metadata, transmitted: 0, buffer: [] });

            // Update the state with the new filename
            setReceivedFiles((prevFiles) => [...prevFiles, metadata.filename]);
        };

        const receiverShareListener = (buffer: any) => {
            setFileShare((prevState: any) => ({
                ...prevState,
                buffer: [...prevState.buffer, buffer],
                transmitted: prevState.transmitted + buffer.byteLength,
            }));
        };

        socket.on("fs-meta", receiverMetadataListener);
        socket.on("fs-share", receiverShareListener);

        return () => {
            socket.off("fs-meta", receiverMetadataListener);
            socket.off("fs-share", receiverShareListener);
        };
    }, []);

    useEffect(() => {
        const progress = Math.round((fileShare.transmitted / (fileShare.metadata?.total_buffer_size || 0)) * 100);
        setReceiveProgress({ file: fileShare.metadata?.filename, progress });

        if (fileShare.transmitted === fileShare.metadata?.total_buffer_size) {
            const blob = new Blob(fileShare.buffer)
            const url = URL.createObjectURL(blob)

            const link = document.createElement("a");
            link.href = url;
            link.download = fileShare.metadata.filename;
            document.body.appendChild(link);
            link.click();

            URL.revokeObjectURL(url);
            document.body.removeChild(link);

            setFileShare({ metadata: null, transmitted: 0, buffer: [] });
        } else socket.emit("fs-start", sessionId);

    }, [fileShare]);

    function leaveSession() {
        socket.emit('manual-disconnect',sessionId)
        router.push(PathEnum.MAIN)
    }

    return (
        <main className="container my-5">
            <h1>ID da sessão: {sessionId}</h1>
            {receivedFiles.length === 0 ? (
                <p className="text-secondary mt-4">Nenhum arquivo recebido até o momento</p>
            ) : (
                <div className="d-flex gap-5 flex-wrap">
                    {receivedFiles.map((file, index) => (
                        <div key={index} style={{ width: 200 }} className="mt-4 border position-relative">
                            <div className="d-flex flex-column align-items-center p-3 ">
                                <Image width={64} height={64} src="/icons/file.svg" alt="File icon" />
                                <p className="text-center mt-4">{file}</p>
                            </div>
                            {receiveProgress.file === file && receiveProgress.progress < 100 && (
                                <div className="bg-body-secondary opacity-75 position-absolute w-100 h-100 top-0 d-flex justify-content-center align-items-center">
                                    <p className="fs-3 fw-semibold">{receiveProgress.progress}%</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <button onClick={leaveSession} className="position-absolute bottom-0 btn btn-danger mb-5">Sair da sessão</button>
        </main>
    );
}
