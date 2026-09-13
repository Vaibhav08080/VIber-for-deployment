import { Fragment } from "@prisma/client";
import { useState } from "react";
import { ExternalLinkIcon, RefreshCcwIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "./hint";
import JSZip from "jszip";

interface Props {
  data: Fragment;
}

export const FragmentWeb = ({ data }: Props) => {
    const [fragmentKey, setFragmentKey] = useState(0);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

    const onRefresh = () => {
        setIsLoading(true);
        setFragmentKey((prev) => prev + 1);
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(data.sandboxUrl);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }

    const handleDownload = async () => {
        if (!data.files || downloading) return;
        setDownloading(true);
        try {
            const zip = new JSZip();
            const files = data.files as { [path: string]: string };

            for (const [filePath, content] of Object.entries(files)) {
                const normalizedPath = filePath.startsWith("/")
                    ? filePath.slice(1)
                    : filePath;
                zip.file(normalizedPath, content);
            }

            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.title.replace(/\s+/g, "-").toLowerCase()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download ZIP:", err);
        } finally {
            setDownloading(false);
        }
    };

  return (
    <div className="flex flex-col w-full h-full flex-1 min-h-0 bg-background">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2 flex-shrink-0">
        <Hint text="Refresh" side="bottom">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon className={isLoading ? "animate-spin" : ""} />
          </Button>
        </Hint>
        <Hint text="Click to copy" side="bottom">
          <Button
            size="sm"
            variant="outline" 
            onClick={handleCopy}
            disabled={!data.sandboxUrl || copied}
            className="flex-1 justify-start text-start font-normal truncate font-mono text-xs"
          >
            <span className="truncate">{data.sandboxUrl}</span>
          </Button>
        </Hint>
        <Hint text="Open in a new tab" side="bottom" align="start">
          <Button
            size="sm"
            disabled={!data.sandboxUrl}
            variant="outline"
            onClick={() => {
              if (!data.sandboxUrl) return;
              window.open(data.sandboxUrl, "_blank");
            }}
          >
            <ExternalLinkIcon className="size-4" />
          </Button>
        </Hint>
        <Hint text="Download as ZIP" side="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            disabled={!data.files || downloading}
            onClick={handleDownload}
          >
            <DownloadIcon className={downloading ? "animate-bounce" : "size-4"} />
          </Button>
        </Hint>
      </div>

      <div className="relative flex-1 min-h-0 w-full h-full bg-zinc-950">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-sm z-10 text-muted-foreground">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs font-medium">Connecting to Next.js preview...</p>
          </div>
        )}
        <iframe
          key={fragmentKey}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          src={data.sandboxUrl}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};
