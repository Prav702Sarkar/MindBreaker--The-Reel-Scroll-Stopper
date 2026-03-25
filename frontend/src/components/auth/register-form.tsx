"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
})

type FormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [authError, setAuthError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setAuthError(null)

    // Call your backend API here
    // Example: fetch('/api/register', { method: 'POST', body: JSON.stringify(data) })
    console.log(data) // to avoid unused variable warning
    
    // Simulating API call for demonstration
    setTimeout(() => {
      setIsLoading(false)
      // On success, redirect to login
      router.push("/login?registered=true")
    }, 1500)
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label className="text-slate-700 font-medium ml-1" htmlFor="name">
              Full name
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              type="text"
              autoCapitalize="words"
              autoComplete="name"
              disabled={isLoading}
              className="rounded-xl px-4 py-6 border-slate-300 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 bg-white"
              {...register("name")}
            />
            {errors?.name && (
              <p className="px-1 text-xs text-red-600 font-medium">
                {errors.name.message}
              </p>
            )}
          </div>
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
              autoComplete="new-password"
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
            Sign up
          </Button>
          {authError && <p className="text-sm font-medium text-red-600 text-center bg-red-50 p-3 rounded-xl border border-red-100">{authError}</p>}
        </div>
      </form>
    </div>
  )
}