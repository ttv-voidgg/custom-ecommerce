"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Copy, ExternalLink } from "lucide-react"

interface FirebaseRulesHelperProps {
    instructions: string[]
    rulesExample: string
}

export function FirebaseRulesHelper({ instructions, rulesExample }: FirebaseRulesHelperProps) {
    const [copied, setCopied] = useState(false)

    const copyRules = () => {
        navigator.clipboard.writeText(rulesExample)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card className="mt-6 border-red-200 bg-red-50">
            <CardHeader className="pb-2">
                <CardTitle className="text-red-800 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Firebase Permission Error
                </CardTitle>
                <CardDescription className="text-red-700">
                    You need to update your Firestore security rules to continue setup
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert className="bg-white border-red-200 mb-4">
                    <AlertTitle>Follow these steps:</AlertTitle>
                    <AlertDescription>
                        <ol className="list-decimal list-inside space-y-1 mt-2">
                            {instructions.map((instruction, index) => (
                                <li key={index} className="text-sm">
                                    {instruction}
                                </li>
                            ))}
                        </ol>
                    </AlertDescription>
                </Alert>

                <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{rulesExample}</pre>
                </div>

                <div className="flex justify-between mt-4">
                    <Button variant="outline" size="sm" onClick={copyRules} className="text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        {copied ? "Copied!" : "Copy Rules"}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open("https://console.firebase.google.com", "_blank")}
                    >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open Firebase Console
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
