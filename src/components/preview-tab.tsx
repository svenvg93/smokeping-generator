import { Download, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

interface PreviewTabProps {
  preview: string
}

export function PreviewTab({ preview }: PreviewTabProps) {
  const { copied, copy } = useCopyToClipboard()

  function handleDownload() {
    const blob = new Blob([preview], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'smokeping.conf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Generated SmokePing configuration file
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(preview)}
          >
            {copied ? (
              <><Check className="h-4 w-4 mr-1.5" /> Copied</>
            ) : (
              <><Copy className="h-4 w-4 mr-1.5" /> Copy</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
        </div>
      </div>
      <textarea
        readOnly
        value={preview}
        className="w-full h-[calc(100vh-220px)] min-h-96 font-mono text-sm rounded-md border border-input bg-muted p-4 resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  )
}
