"use client";

import type { DetailedReactHTMLElement, HTMLAttributes, ReactNode } from "react";
import React, { cloneElement, useRef } from "react";
import { filterDOMProps } from "@react-aria/utils";

interface FileTriggerProps {
    /**
     * Specifies what mime type of files are allowed.
     */
    acceptedFileTypes?: Array<string>;
    /**
     * Whether multiple files can be selected.
     */
    allowsMultiple?: boolean;
    /**
     * Specifies the use of a media capture mechanism to capture the media on the spot.
     */
    defaultCamera?: "user" | "environment";
    /**
     * Handler when a user selects a file.
     */
    onSelect?: (files: FileList | null) => void;
    /**
     * The children of the component.
     */
    children: ReactNode;
    /**
     * Enables the selection of directories instead of individual files.
     */
    acceptDirectory?: boolean;
}

/**
 * A FileTrigger allows a user to access the file system with any pressable React Aria or React Spectrum component, or custom components built with usePress.
 */
export const FileTrigger = (props: FileTriggerProps) => {
    const { children, onSelect, acceptedFileTypes, allowsMultiple, defaultCamera, acceptDirectory, ...rest } = props;

    const inputRef = useRef<HTMLInputElement | null>(null);
    const domProps = filterDOMProps(rest);

    // Make sure that only one child is passed to the component.
    const clonableElement = React.Children.only(children);

    // Clone the child element and add an `onClick` handler to open the file dialog.
    const mainElement = cloneElement(clonableElement as DetailedReactHTMLElement<HTMLAttributes<HTMLElement>, HTMLElement>, {
        onClick: (e: React.MouseEvent) => {
            // Call the original onClick handler if it exists
            const originalOnClick = (clonableElement as any).props?.onClick;
            if (originalOnClick) {
                originalOnClick(e);
            }
            
            // Clear the input value to ensure onChange fires even when same file is selected
            if (inputRef.current?.value) {
                inputRef.current.value = "";
            }
            
            // Trigger the file input click
            inputRef.current?.click();
        },
    });

    return (
        <>
            {mainElement}
            <input
                {...domProps}
                type="file"
                ref={inputRef}
                style={{ display: "none" }}
                accept={acceptedFileTypes?.toString()}
                onChange={(e) => onSelect?.(e.target.files)}
                capture={defaultCamera}
                multiple={allowsMultiple}
                // @ts-expect-error
                webkitdirectory={acceptDirectory ? "" : undefined}
            />
        </>
    );
};
