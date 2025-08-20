"use client";

import type { ComponentProps } from "react";
import { useId, useRef, useState } from "react";
import { UploadCloud02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { FileTrigger } from "@/components/base/file-upload-trigger/file-upload-trigger";
import { cx } from "@/utils/cx";

interface PdfUploadDropZoneProps {
    /** The class name of the drop zone. */
    className?: string;
    /**
     * A hint text explaining what files can be dropped.
     */
    hint?: string;
    /**
     * Disables dropping or uploading files.
     */
    isDisabled?: boolean;
    /**
     * Specifies the types of files that the server accepts.
     * Examples: "image/*", ".pdf,image/*", "image/*,video/mpeg,application/pdf"
     */
    accept?: string;
    /**
     * Allows multiple file uploads.
     */
    allowsMultiple?: boolean;
    /**
     * Maximum file size in bytes.
     */
    maxSize?: number;
    /**
     * Callback function that is called with the list of dropped files
     * when files are dropped on the drop zone.
     */
    onDropFiles?: (files: FileList) => void;
    /**
     * Callback function that is called with the list of unaccepted files
     * when files are dropped on the drop zone.
     */
    onDropUnacceptedFiles?: (files: FileList) => void;
    /**
     * Callback function that is called with the list of files that exceed
     * the size limit when files are dropped on the drop zone.
     */
    onSizeLimitExceed?: (files: FileList) => void;
}

export const PdfUploadDropZone = ({
    className,
    hint,
    isDisabled,
    accept = "application/pdf,.pdf",
    allowsMultiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB default
    onDropFiles,
    onDropUnacceptedFiles,
    onSizeLimitExceed,
}: PdfUploadDropZoneProps) => {
    const [isInvalid, setIsInvalid] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const isFileTypeAccepted = (file: File): boolean => {
        if (!accept) return true;

        // Split the accept string into individual types
        const acceptedTypes = accept.split(",").map((type) => type.trim());

        return acceptedTypes.some((acceptedType) => {
            // Handle file extensions (e.g., .pdf, .doc)
            if (acceptedType.startsWith(".")) {
                const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
                return extension === acceptedType.toLowerCase();
            }

            // Handle wildcards (e.g., image/*)
            if (acceptedType.endsWith("/*")) {
                const typePrefix = acceptedType.split("/")[0];
                return file.type.startsWith(`${typePrefix}/`);
            }

            // Handle exact MIME types (e.g., application/pdf)
            return file.type === acceptedType;
        });
    };

    const handleDragIn = (event: React.DragEvent<HTMLDivElement>) => {
        if (isDisabled) return;

        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragOut = (event: React.DragEvent<HTMLDivElement>) => {
        if (isDisabled) return;

        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(false);
    };

    const processFiles = (files: File[]): void => {
        // Reset the invalid state when processing files.
        setIsInvalid(false);

        const acceptedFiles: File[] = [];
        const unacceptedFiles: File[] = [];
        const oversizedFiles: File[] = [];

        // If multiple files are not allowed, only process the first file
        const filesToProcess = allowsMultiple ? files : files.slice(0, 1);

        filesToProcess.forEach((file) => {
            // Check file size first
            if (maxSize && file.size > maxSize) {
                oversizedFiles.push(file);
                return;
            }

            // Then check file type
            if (isFileTypeAccepted(file)) {
                acceptedFiles.push(file);
            } else {
                unacceptedFiles.push(file);
            }
        });

        // Handle oversized files
        if (oversizedFiles.length > 0 && typeof onSizeLimitExceed === "function") {
            const dataTransfer = new DataTransfer();
            oversizedFiles.forEach((file) => dataTransfer.items.add(file));

            setIsInvalid(true);
            onSizeLimitExceed(dataTransfer.files);
        }

        // Handle accepted files
        if (acceptedFiles.length > 0 && typeof onDropFiles === "function") {
            const dataTransfer = new DataTransfer();
            acceptedFiles.forEach((file) => dataTransfer.items.add(file));
            onDropFiles(dataTransfer.files);
        }

        // Handle unaccepted files
        if (unacceptedFiles.length > 0 && typeof onDropUnacceptedFiles === "function") {
            const unacceptedDataTransfer = new DataTransfer();
            unacceptedFiles.forEach((file) => unacceptedDataTransfer.items.add(file));

            setIsInvalid(true);
            onDropUnacceptedFiles(unacceptedDataTransfer.files);
        }

        // File input clearing is handled by FileTrigger
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        if (isDisabled) return;

        handleDragOut(event);
        processFiles(Array.from(event.dataTransfer.files));
    };

    const handleFileSelect = (files: FileList | null) => {
        if (files) {
            processFiles(Array.from(files));
        }
    };

    return (
        <div
            data-dropzone
            onDragOver={handleDragIn}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragEnd={handleDragOut}
            onDrop={handleDrop}
            className={cx(
                "relative flex flex-col items-center gap-4 rounded-xl bg-primary px-6 py-8 text-tertiary ring-1 ring-secondary transition-all duration-200 ease-in-out ring-inset",
                isDraggingOver && "ring-2 ring-brand bg-brand-25",
                isDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled_subtle opacity-60",
                className,
            )}
        >
            <FeaturedIcon 
                color={isDraggingOver ? "brand" : "gray"} 
                theme="light-circle-outline" 
                size="lg"
                className="transition-colors duration-200"
            >
                <UploadCloud02 className="size-6" />
            </FeaturedIcon>

            <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="flex items-center gap-1.5">
                    <FileTrigger
                        onSelect={handleFileSelect}
                        acceptedFileTypes={accept.split(",")}
                        allowsMultiple={allowsMultiple}
                    >
                        <Button 
                            color="link-color" 
                            size="md" 
                            isDisabled={isDisabled}
                            type="button"
                        >
                            Klicken zum Hochladen
                        </Button>
                    </FileTrigger>
                    <span className="text-sm font-medium text-secondary">
                        oder Datei hierher ziehen
                    </span>
                </div>
                <p className={cx(
                    "text-xs text-tertiary mt-1 transition-colors duration-200", 
                    isInvalid && "text-error-primary font-medium"
                )}>
                    {hint || "PDF-Dokumente bis zu 10 MB"}
                </p>
            </div>
        </div>
    );
};