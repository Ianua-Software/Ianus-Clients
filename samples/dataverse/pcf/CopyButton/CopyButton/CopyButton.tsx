import * as React from "react";
import { IconButton } from "@fluentui/react";

export const copyToClipboard = async (text?: string) => {
    if (text && navigator.clipboard) {
        await navigator.clipboard.writeText(text?.trim() ?? "");
    }
};

export interface CopyButtonProps {
    disabled?: boolean;
    value?: string;
    title?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ disabled, value, title }) => {
    const [showCheckmark, setShowCheckmark] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleClick = async () => {
        if (value) {
            await copyToClipboard(value);
        }

        // Show checkmark and reset timer
        setShowCheckmark(true);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setShowCheckmark(false);
        }, 2000);
    };

    // Clean up timeout on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <IconButton
            title={title}
            iconProps={showCheckmark ? ({ iconName: "Accept" }) : ({ iconName: "Copy" })}
            disabled={disabled}
            onClick={handleClick}
        />
    );
};
