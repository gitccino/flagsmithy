'use client'

import { useTransition, useState, useEffect } from 'react'
import { createApiKey } from '@/app/(admin)/settings/actions'
import { runActionWithToast } from '@/lib/action-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function CreateApiKeyForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const response = await runActionWithToast(createApiKey(formData), {
        loading: 'Creating API key…',
        success: (r) => r.message ?? 'API key created',
        error: (r) => r.message,
      })

      if (response.ok && response.data) {
        setRevealedKey(response.data.rawKey)
        setCopied(false)
        form.reset()
      }
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setRevealedKey(null)
      setCopied(false)
    }
  }

  const handleCopy = () => {
    if (!revealedKey) return
    navigator.clipboard.writeText(revealedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button type="button" variant="default" size="lg">
            Create key
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="p-6">
          {revealedKey ? (
            <>
              <DialogHeader>
                <DialogTitle>Save your API key</DialogTitle>
                <DialogDescription>
                  Keep a record of the key below. You won't be able to view it
                  again
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 bg-destructive/10 rounded-md p-4 pb-2">
                <code className="flex-1 flex flex-col text-sm font-mono break-all">
                  {revealedKey}
                </code>
                <Button
                  type="button"
                  variant="none"
                  onClick={handleCopy}
                  className="w-fit ml-auto text-muted-foreground text-xs"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-[#03E072]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="rotate-90" />
                      Copy Key
                    </>
                  )}
                </Button>
              </div>

              <DialogClose asChild className="w-fit ml-auto">
                <Button variant="link">Close</Button>
              </DialogClose>
            </>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full space-y-6"
              noValidate
            >
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  API Keys are scoped to the active environment
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Label htmlFor="name" className="text-muted-foreground">
                  Name your key:
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., my-api-key"
                  required
                  className="w-full"
                  autoComplete="off"
                />
              </div>
              <div className="ml-auto w-fit">
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="px-4"
                >
                  Create key
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/*{revealedKey && (
        <div className="rounded-lg border border-border bg-flag-card-background p-4 space-y-2">
          <p className="text-xs font-medium text-[#03E072]">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-background rounded px-3 py-2 break-all">
              {revealedKey}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check size={14} className="text-[#03E072]" />
              ) : (
                <Copy size={14} />
              )}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setRevealedKey(null)}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            I've saved it — dismiss
          </button>
        </div>
      )}*/}
    </div>
  )
}
