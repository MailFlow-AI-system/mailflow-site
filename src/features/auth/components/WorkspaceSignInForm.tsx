import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@mailflow/ui/components'
import { useForm } from 'react-hook-form'

import { workspaceHost, workspaceLoginUrl } from '@/shared/config/workspaceUrl'
import { type WorkspaceSignInValues, workspaceSignInSchema } from '../schemas/workspaceSignInSchema'

type WorkspaceSignInFormProps = {
  workspaceBaseOrigin: string
  onNavigate?: ((url: string) => void) | undefined
}

export default function WorkspaceSignInForm({
  workspaceBaseOrigin,
  onNavigate,
}: WorkspaceSignInFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<WorkspaceSignInValues>({
    resolver: zodResolver(workspaceSignInSchema),
    defaultValues: { workspaceSlug: '' },
  })

  const onSubmit = ({ workspaceSlug }: WorkspaceSignInValues) => {
    const loginUrl = workspaceLoginUrl(workspaceBaseOrigin, workspaceSlug)
    if (!loginUrl) {
      setError('workspaceSlug', { message: 'Use letters, numbers and single hyphens.' })
      return
    }
    if (onNavigate) onNavigate(loginUrl)
    else window.location.assign(loginUrl)
  }

  return (
    <form
      aria-label="Find your workspace"
      className="grid gap-5"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="sign-in-workspace-slug">
          Workspace subdomain
        </label>
        <div className="flex min-w-0 items-center gap-2">
          <Input
            id="sign-in-workspace-slug"
            className="min-w-0 flex-1"
            autoComplete="off"
            autoCapitalize="none"
            autoFocus
            spellCheck={false}
            maxLength={63}
            placeholder="your-team"
            required
            aria-invalid={errors.workspaceSlug ? true : undefined}
            aria-describedby={`sign-in-workspace-host${errors.workspaceSlug ? ' sign-in-workspace-slug-error' : ''}`}
            {...register('workspaceSlug')}
          />
          <span id="sign-in-workspace-host" className="shrink-0 text-sm text-muted-foreground">
            .{workspaceHost(workspaceBaseOrigin)}
          </span>
        </div>
        {errors.workspaceSlug && (
          <p id="sign-in-workspace-slug-error" className="text-sm text-destructive" role="alert">
            {errors.workspaceSlug.message}
          </p>
        )}
      </div>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        Continue
      </Button>
    </form>
  )
}
