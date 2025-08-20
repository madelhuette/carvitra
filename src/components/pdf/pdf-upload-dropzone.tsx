"use client";

import type { ComponentProps } from "react";
import { useId, useRef, useState } from "react";
import { UploadCloud02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
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
    accept,
    allowsMultiple = true,
    maxSize,
    onDropFiles,
    onDropUnacceptedFiles,
    onSizeLimitExceed,
}: PdfUploadDropZoneProps) => {
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);
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

        // Clear the input value to ensure the same file can be selected again
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        if (isDisabled) return;

        handleDragOut(event);
        processFiles(Array.from(event.dataTransfer.files));
    };

    const handleInputFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(Array.from(event.target.files || []));
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
                "relative flex flex-col items-center gap-3 rounded-xl bg-secondary px-6 py-4 text-secondary ring-1 ring-tertiary transition duration-100 ease-linear ring-inset",
                isDraggingOver && "ring-2 ring-brand",
                isDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled_subtle",
                className,
            )}
        >
            <FeaturedIcon color="gray" theme="modern" size="md">
                <UploadCloud02 className="size-5" />
            </FeaturedIcon>

            <div className="flex flex-col gap-1 text-center">
                <input
                    ref={inputRef}
                    id={id}
                    type="file"
                    className="peer sr-only"
                    disabled={isDisabled}
                    accept={accept}
                    multiple={allowsMultiple}
                    onChange={handleInputFileChange}
                />
                <Button 
                    color="link-color" 
                    size="md" 
                    isDisabled={isDisabled}
                    onClick={(e) => {
                        e.preventDefault();
                        inputRef.current?.click();
                    }}
                >
                    Klicken zum Hochladen
                </Button>
                <span className="text-sm text-secondary">
                    oder per Drag & Drop hierher ziehen
                </span>
                <p className={cx("text-xs transition duration-100 ease-linear", isInvalid && "text-error-primary")}>
                    {hint || "SVG, PNG, JPG oder GIF (max. 800x400px)"}
                </p>
            </div>
        </div>
    );
};