import { Input } from '@mailflow/ui/components'
import type { SignupWorkspaceFieldsProps } from '../types/signup'

export function SignupWorkspaceFields({ form, webAppUrl }: SignupWorkspaceFieldsProps) {
  const {
    register,
    formState: { errors },
  } = form
  const zone = new URL(webAppUrl).host
  return (
    <fieldset className="grid min-w-0 gap-5">
      <legend className="sr-only">Your workspace</legend>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="signup-workspace-name">
          Workspace name
        </label>
        <Input
          id="signup-workspace-name"
          autoComplete="organization"
          maxLength={120}
          required
          aria-invalid={errors.workspaceName ? true : undefined}
          aria-describedby={errors.workspaceName ? 'signup-workspace-name-error' : undefined}
          {...register('workspaceName')}
        />
        {errors.workspaceName && (
          <p id="signup-workspace-name-error" className="text-sm text-destructive">
            {errors.workspaceName.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="signup-workspace-slug">
          Workspace subdomain
        </label>
        <Input
          id="signup-workspace-slug"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={63}
          required
          aria-invalid={errors.workspaceSlug ? true : undefined}
          aria-describedby={`signup-workspace-slug-help${errors.workspaceSlug ? ' signup-workspace-slug-error' : ''}`}
          {...register('workspaceSlug')}
        />
        <p id="signup-workspace-slug-help" className="break-words text-xs text-muted-foreground">
          Your address: your-subdomain.{zone}. Use letters, numbers and single hyphens. Availability
          is checked when you create your account.
        </p>
        {errors.workspaceSlug && (
          <p id="signup-workspace-slug-error" className="text-sm text-destructive">
            {errors.workspaceSlug.message}
          </p>
        )}
      </div>
    </fieldset>
  )
}
