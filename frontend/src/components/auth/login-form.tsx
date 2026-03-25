"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
})

type FormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [authError, setAuthError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setAuthError(null)

    const signInResult = await signIn("credentials", {
      email: data.email.toLowerCase(),
      password: data.password,
      redirect: false,
    })

    setIsLoading(false)

    if (!signInResult?.ok) {
      setAuthError("Invalid credentials. Please try test@example.com / password123.")
      return
    }

    // Force a hard navigation to make sure App Router middleware sees the new session cookie.
    window.location.href = "/dashboard"
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label className="text-slate-700 font-medium ml-1" htmlFor="email">
              Email address
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              className="rounded-xl px-4 py-6 border-slate-300 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 bg-white"
              {...register("email")}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label className="text-slate-700 font-medium ml-1" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              className="rounded-xl px-4 py-6 border-slate-300 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 bg-white"
              {...register("password")}
            />
            {errors?.password && (
              <p className="px-1 text-xs text-red-600 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button disabled={isLoading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12 text-base transition shadow-md shadow-indigo-100 mt-2">
            {isLoading && (
              <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
            )}
            Log in
          </Button>
          {authError && <p className="text-sm font-medium text-red-600 text-center bg-red-50 p-3 rounded-xl border border-red-100">{authError}</p>}
        </div>
      </form>
    </div>
  )
}