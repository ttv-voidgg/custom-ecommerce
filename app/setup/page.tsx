"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  CheckCircle,
  Circle,
  Database,
  User,
  Settings,
  Upload,
  Store,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { uploadWithProgress } from "@/lib/upload-with-progress"
import { FirebaseRulesHelper } from "./firebase-rules-helper"

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface StoreConfig {
  storeName: string
  storeDescription: string
  currency: string
  logoUrl: string
  adminEmail: string
  adminPassword: string
  adminFirstName: string
  adminLastName: string
}

interface FirebaseError {
  message: string
  instructions: string
  rulesExample: string
}

export default function SetupWizard() {
  const router = useRouter()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [checkingFirebase, setCheckingFirebase] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    storeName: "Lumière Jewelry",
    storeDescription: "Timeless elegance in every piece",
    currency: "USD",
    logoUrl: "",
    adminEmail: "",
    adminPassword: "",
    adminFirstName: "",
    adminLastName: "",
  })

  const [sftpReady, setSftpReady] = useState(false)
  const [checkingSftp, setCheckingSftp] = useState(false)
  const [sftpError, setSftpError] = useState<string | null>(null)
  const [sftpDetails, setSftpDetails] = useState<any>(null)

  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "welcome",
      title: "Welcome",
      description: "Welcome to your jewelry store setup",
      icon: <Store className="h-6 w-6" />,
      completed: false,
    },
    {
      id: "firebase-check",
      title: "System Check",
      description: "Verify Firebase and SFTP connections",
      icon: <Wifi className="h-6 w-6" />,
      completed: false,
    },
    {
      id: "store-config",
      title: "Store Configuration",
      description: "Configure your store details",
      icon: <Settings className="h-6 w-6" />,
      completed: false,
    },
    {
      id: "admin-account",
      title: "Admin Account",
      description: "Create your admin account",
      icon: <User className="h-6 w-6" />,
      completed: false,
    },
    {
      id: "database-setup",
      title: "Database Setup",
      description: "Initialize your database",
      icon: <Database className="h-6 w-6" />,
      completed: false,
    },
    {
      id: "demo-data",
      title: "Demo Products",
      description: "Add sample jewelry products",
      icon: <Upload className="h-6 w-6" />,
      completed: false,
    },
    {
      id: "complete",
      title: "Complete",
      description: "Your store is ready!",
      icon: <CheckCircle className="h-6 w-6" />,
      completed: false,
    },
  ])

  const [uploadProgress, setUploadProgress] = useState(0)
  const [firebaseError, setFirebaseError] = useState<{
    message: string
    instructions: string[]
    rulesExample: string
  } | null>(null)

  // Check Firebase initialization on component mount
  useEffect(() => {
    checkFirebaseStatus()
  }, [])

  const checkFirebaseStatus = async () => {
    setCheckingFirebase(true)
    setCheckingSftp(true)
    setSftpError(null)
    setSftpDetails(null)
    setFirebaseError(null)

    try {
      // Check Firebase
      const { isFirebaseReady, firebaseStatus } = await import("@/lib/firebase")
      console.log("Firebase Status:", firebaseStatus)

      if (isFirebaseReady()) {
        setFirebaseReady(true)
        toast({
          title: "Firebase Connected",
          description: "All Firebase services are ready",
        })
      } else {
        setFirebaseReady(false)
        toast({
          title: "Firebase Connection Issue",
          description: "Some Firebase services are not ready. Check your .env.local file.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Firebase check error:", error)
      setFirebaseReady(false)
      toast({
        title: "Firebase Error",
        description: "Failed to initialize Firebase services. Check your configuration.",
        variant: "destructive",
      })
    } finally {
      setCheckingFirebase(false)
    }

    // Check SFTP
    try {
      console.log("Testing SFTP connection...")
      const response = await fetch("/api/setup/test-sftp")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response from SFTP test:", text)
        throw new Error("Server returned non-JSON response")
      }

      const result = await response.json()

      if (result.success) {
        setSftpReady(true)
        setSftpDetails(result.details)
        toast({
          title: "SFTP Connected",
          description: "File upload system is ready",
        })
      } else {
        setSftpReady(false)
        setSftpError(result.error)
        setSftpDetails(result)
        toast({
          title: "SFTP Connection Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("SFTP check error:", error)
      setSftpReady(false)
      setSftpError(error instanceof Error ? error.message : "Failed to test SFTP connection")
      toast({
        title: "SFTP Test Failed",
        description: "Could not test file upload system",
        variant: "destructive",
      })
    } finally {
      setCheckingSftp(false)
    }
  }

  const updateStepCompletion = (stepIndex: number, completed: boolean) => {
    setSteps((prev) => prev.map((step, index) => (index === stepIndex ? { ...step, completed } : step)))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      updateStepCompletion(currentStep, true)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFirebaseCheck = () => {
    // Allow continuing with just Firebase if SFTP fails
    // SFTP is nice to have but not required for basic setup
    if (firebaseReady) {
      if (!sftpReady) {
        toast({
          title: "Continuing without SFTP",
          description: "File uploads will use local storage as fallback",
        })
      }
      nextStep()
    } else {
      toast({
        title: "Firebase Required",
        description: "Firebase connection is required to continue setup",
        variant: "destructive",
      })
    }
  }

  const handleStoreConfigSubmit = () => {
    if (!storeConfig.storeName.trim()) {
      toast({
        title: "Error",
        description: "Store name is required",
        variant: "destructive",
      })
      return
    }
    nextStep()
  }

  const handleAdminAccountSubmit = async () => {
    if (!storeConfig.adminEmail || !storeConfig.adminPassword || !storeConfig.adminFirstName) {
      toast({
        title: "Error",
        description: "All admin fields are required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("Creating admin account...")
      const response = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: storeConfig.adminEmail,
          password: storeConfig.adminPassword,
          firstName: storeConfig.adminFirstName,
          lastName: storeConfig.adminLastName,
        }),
      })

      const result = await response.json()
      console.log("Admin creation result:", result)

      if (result.success) {
        toast({
          title: "Success!",
          description: "Admin account created successfully",
        })
        nextStep()
      } else {
        throw new Error(result.error || "Failed to create admin account")
      }
    } catch (error: any) {
      console.error("Admin creation error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDatabaseSetup = async () => {
    setLoading(true)
    try {
      console.log("Initializing database...")
      const response = await fetch("/api/setup/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeConfig),
      })

      const result = await response.json()
      console.log("Database setup result:", result)

      if (result.success) {
        toast({
          title: "Success!",
          description: "Database initialized successfully",
        })
        nextStep()
      } else {
        // Handle permission errors with specific guidance
        if (result.error === "Firebase permission denied") {
          toast({
            title: "Firebase Permission Error",
            description: "You need to update your Firestore security rules",
            variant: "destructive",
          })

          // Show detailed instructions
          console.error("Firebase Permission Error:")
          console.error("Please update your Firestore security rules in the Firebase Console")
          console.error("Temporary rules for setup:")
          console.error(result.rulesExample)

          // Display instructions in the UI
          setFirebaseError({
            message: "Firebase permission denied. You need to update your Firestore security rules.",
            instructions: result.instructions,
            rulesExample: result.rulesExample,
          })
        } else {
          throw new Error(result.error || "Failed to initialize database")
        }
      }
    } catch (error: any) {
      console.error("Database setup error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to initialize database. Check Firebase permissions.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoDataSetup = async () => {
    setLoading(true)
    try {
      console.log("Adding demo data...")
      const response = await fetch("/api/setup/demo-data", {
        method: "POST",
      })

      const result = await response.json()
      console.log("Demo data result:", result)

      if (result.success) {
        toast({
          title: "Success!",
          description: `Added ${result.count} demo products to your store`,
        })
        nextStep()
      } else {
        throw new Error(result.error || "Failed to add demo data")
      }
    } catch (error: any) {
      console.error("Demo data error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add demo data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const completeSetup = async () => {
    setLoading(true)
    try {
      console.log("Completing setup...")
      const response = await fetch("/api/setup/complete", {
        method: "POST",
      })

      const result = await response.json()
      console.log("Setup completion result:", result)

      if (result.success) {
        setSetupComplete(true)
        updateStepCompletion(currentStep, true)
        toast({
          title: "Setup Complete!",
          description: "Your jewelry store is ready to use",
        })

        // Redirect to admin dashboard after a delay
        setTimeout(() => {
          router.push("/admin")
        }, 2000)
      }
    } catch (error) {
      console.error("Setup completion error:", error)
      toast({
        title: "Error",
        description: "Failed to complete setup",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      console.log("=== Logo Upload Starting ===")
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      toast({
        title: "Uploading logo...",
        description: "Please wait while we upload your logo to SFTP",
      })

      // Try SFTP upload first with progress tracking
      try {
        console.log("Attempting SFTP upload first...")
        const result = await uploadWithProgress("/api/files", file, "/logos", (percentage) => {
          console.log(`Upload progress: ${percentage}%`)
          setUploadProgress(percentage)
        })

        console.log("SFTP upload result:", result)

        if (result.success && result.url) {
          setStoreConfig((prev) => ({ ...prev, logoUrl: result.url }))
          toast({
            title: "Logo uploaded to SFTP!",
            description: "Your store logo has been uploaded successfully",
          })
          console.log("=== Logo Upload Completed Successfully ===")
        } else {
          throw new Error("SFTP upload response missing URL")
        }
      } catch (sftpError) {
        console.error("SFTP upload failed:", sftpError)

        // Reset progress for fallback attempt
        setUploadProgress(0)

        console.log("SFTP upload failed, trying local fallback...")
        toast({
          title: "SFTP upload failed",
          description: "Trying local storage fallback...",
          variant: "destructive",
        })

        // Try local fallback with progress tracking
        try {
          const fallbackResult = await uploadWithProgress("/api/files/local", file, "/logos", (percentage) => {
            console.log(`Local fallback upload progress: ${percentage}%`)
            setUploadProgress(percentage)
          })

          console.log("Local fallback result:", fallbackResult)

          if (fallbackResult.success && fallbackResult.url) {
            setStoreConfig((prev) => ({ ...prev, logoUrl: fallbackResult.url }))
            toast({
              title: "Logo uploaded locally",
              description: "SFTP failed, but logo was stored locally as fallback",
            })
            setUploadError("SFTP upload failed, using local storage")
          } else {
            throw new Error("Local fallback also failed")
          }
        } catch (localError) {
          console.error("Local fallback failed:", localError)
          throw new Error(
              `Both SFTP and local upload failed. ${localError instanceof Error ? localError.message : String(localError)}`,
          )
        }
      }
    } catch (error) {
      console.error("=== Logo Upload Failed ===")
      console.error("Upload error:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to upload logo"
      setUploadError(errorMessage)

      toast({
        title: "Upload failed",
        description: `${errorMessage}. You can add a logo later in admin settings.`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const renderStepContent = () => {
    switch (steps[currentStep]?.id) {
      case "welcome":
        return (
            <div className="text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-600 rounded-full flex items-center justify-center">
                <Store className="h-12 w-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-light tracking-wide text-gray-900 mb-4">Welcome to Lumière</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Let's set up your luxury jewelry ecommerce store. This wizard will guide you through the initial
                  configuration and add demo data to get you started.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">What we'll set up:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Firebase connection verification</li>
                  <li>• SFTP file upload system (optional)</li>
                  <li>• Store configuration and branding</li>
                  <li>• Admin account creation</li>
                  <li>• Database initialization</li>
                  <li>• Sample jewelry products</li>
                </ul>
              </div>
            </div>
        )

      case "firebase-check":
        return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-2">System Check</h2>
                <p className="text-gray-600">Verifying Firebase and SFTP connections.</p>
              </div>

              <div className="space-y-4">
                {/* Firebase Status */}
                <Alert className={firebaseReady ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {firebaseReady ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                      <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={firebaseReady ? "text-green-800" : "text-red-800"}>
                    <strong>Firebase:</strong>{" "}
                    {checkingFirebase
                        ? "Checking connection..."
                        : firebaseReady
                            ? "✅ Connected and ready"
                            : "❌ Connection failed"}
                  </AlertDescription>
                </Alert>

                {/* SFTP Status */}
                <Alert className={sftpReady ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                  {sftpReady ? (
                      <Upload className="h-4 w-4 text-green-600" />
                  ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <AlertDescription className={sftpReady ? "text-green-800" : "text-yellow-800"}>
                    <strong>SFTP File System:</strong>{" "}
                    {checkingSftp
                        ? "Testing connection..."
                        : sftpReady
                            ? "✅ Connected and ready"
                            : `⚠️ ${sftpError || "Connection failed"} (will use local fallback)`}
                  </AlertDescription>
                </Alert>

                {/* SFTP Details */}
                {sftpReady && sftpDetails && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">SFTP Connection Details:</h3>
                      <div className="text-sm text-green-800 space-y-1">
                        <div>
                          Host: {sftpDetails.host}:{sftpDetails.port}
                        </div>
                        <div>Username: {sftpDetails.username}</div>
                        <div>Base Directory: {sftpDetails.baseDir}</div>
                        <div>Base URL: {sftpDetails.baseUrl}</div>
                        <div className="mt-2">
                          <strong>Tests Passed:</strong>
                          <ul className="mt-1 space-y-1">
                            {sftpDetails.tests?.map((test: string, index: number) => (
                                <li key={index}>{test}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                )}

                {/* Directory Contents */}
                {sftpReady && sftpDetails?.directoryContents && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">
                        Directory Contents: {sftpDetails.directoryContents.path}
                      </h3>
                      {sftpDetails.directoryContents.files.length === 0 ? (
                          <p className="text-sm text-green-800">Directory is empty (ready for uploads)</p>
                      ) : (
                          <div className="mt-2 max-h-60 overflow-y-auto">
                            <table className="w-full text-sm text-green-800">
                              <thead className="text-xs uppercase bg-green-100">
                              <tr>
                                <th className="px-2 py-1 text-left">Name</th>
                                <th className="px-2 py-1 text-left">Type</th>
                                <th className="px-2 py-1 text-right">Size</th>
                                <th className="px-2 py-1 text-right">Modified</th>
                              </tr>
                              </thead>
                              <tbody>
                              {sftpDetails.directoryContents.files.map((file: any, index: number) => (
                                  <tr key={index} className={index % 2 === 0 ? "bg-green-50" : "bg-green-100/50"}>
                                    <td className="px-2 py-1">{file.name}</td>
                                    <td className="px-2 py-1">{file.type}</td>
                                    <td className="px-2 py-1 text-right">
                                      {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "-"}
                                    </td>
                                    <td className="px-2 py-1 text-right">{file.modifiedAt}</td>
                                  </tr>
                              ))}
                              </tbody>
                            </table>
                            {sftpDetails.directoryContents.totalFiles > sftpDetails.directoryContents.files.length && (
                                <p className="text-xs text-green-700 mt-2">
                                  Showing {sftpDetails.directoryContents.files.length} of{" "}
                                  {sftpDetails.directoryContents.totalFiles} items
                                </p>
                            )}
                          </div>
                      )}
                    </div>
                )}

                {/* Parent Directory Contents (if base directory doesn't exist) */}
                {!sftpReady && sftpDetails?.parentDirectory && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-2">
                        Parent Directory Contents: {sftpDetails.parentDirectory.path}
                      </h3>
                      {sftpDetails.parentDirectory.files.length === 0 ? (
                          <p className="text-sm text-yellow-800">Parent directory is empty</p>
                      ) : (
                          <div className="mt-2 max-h-60 overflow-y-auto">
                            <table className="w-full text-sm text-yellow-800">
                              <thead className="text-xs uppercase bg-yellow-100">
                              <tr>
                                <th className="px-2 py-1 text-left">Name</th>
                                <th className="px-2 py-1 text-left">Type</th>
                                <th className="px-2 py-1 text-right">Size</th>
                              </tr>
                              </thead>
                              <tbody>
                              {sftpDetails.parentDirectory.files.map((file: any, index: number) => (
                                  <tr key={index} className={index % 2 === 0 ? "bg-yellow-50" : "bg-yellow-100/50"}>
                                    <td className="px-2 py-1">{file.name}</td>
                                    <td className="px-2 py-1">{file.type}</td>
                                    <td className="px-2 py-1 text-right">
                                      {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "-"}
                                    </td>
                                  </tr>
                              ))}
                              </tbody>
                            </table>
                          </div>
                      )}
                      <p className="text-xs text-yellow-700 mt-2">
                        The target directory doesn't exist. This shows the contents of the parent directory to help
                        troubleshoot.
                      </p>
                    </div>
                )}

                {/* Error Details and Troubleshooting */}
                {(!firebaseReady || (!sftpReady && !checkingSftp)) && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-2">Troubleshooting:</h3>

                      {!firebaseReady && (
                          <div className="mb-4">
                            <h4 className="font-medium text-yellow-800">Firebase Issues (Required):</h4>
                            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside mt-1">
                              <li>Check your .env.local file has all Firebase configuration variables</li>
                              <li>Verify your Firebase project is set up correctly</li>
                              <li>Ensure Firestore and Authentication are enabled</li>
                              <li>Restart your development server</li>
                            </ol>
                          </div>
                      )}

                      {!sftpReady && sftpDetails?.troubleshooting && (
                          <div>
                            <h4 className="font-medium text-yellow-800">SFTP Issues (Optional):</h4>
                            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside mt-1">
                              {sftpDetails.troubleshooting.map((step: string, index: number) => (
                                  <li key={index}>{step}</li>
                              ))}
                            </ol>
                            {sftpDetails.details && (
                                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                                  <strong>Error Details:</strong> {sftpDetails.details}
                                </div>
                            )}
                          </div>
                      )}

                      {firebaseError && (
                          <div className="mt-4">
                            <h4 className="font-medium text-red-800">Firebase Permission Error:</h4>
                            <p className="text-sm text-red-800">{firebaseError.message}</p>
                            <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                              <strong>Instructions:</strong> {firebaseError.instructions}
                            </div>
                            <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                              <strong>Temporary Rules Example:</strong> {firebaseError.rulesExample}
                            </div>
                          </div>
                      )}
                    </div>
                )}
              </div>

              <div className="text-center space-y-4">
                <Button onClick={checkFirebaseStatus} disabled={checkingFirebase || checkingSftp} variant="outline">
                  {checkingFirebase || checkingSftp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing Systems...
                      </>
                  ) : (
                      <>
                        <Wifi className="mr-2 h-4 w-4" />
                        Recheck Systems
                      </>
                  )}
                </Button>

                {firebaseReady && (
                    <Button onClick={handleFirebaseCheck} size="lg">
                      Continue Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}

                {!firebaseReady && (
                    <div className="text-sm text-red-600">Firebase connection is required to continue setup.</div>
                )}

                {firebaseReady && !sftpReady && (
                    <div className="text-sm text-yellow-700">
                      <strong>Note:</strong> SFTP connection failed, but you can continue. File uploads will use local
                      storage as a fallback.
                    </div>
                )}
              </div>
            </div>
        )

      case "store-config":
        return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-2">Store Configuration</h2>
                <p className="text-gray-600">Configure your store's basic information and branding.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                      id="storeName"
                      value={storeConfig.storeName}
                      onChange={(e) => setStoreConfig((prev) => ({ ...prev, storeName: e.target.value }))}
                      placeholder="Enter your store name"
                  />
                </div>

                <div>
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Textarea
                      id="storeDescription"
                      value={storeConfig.storeDescription}
                      onChange={(e) => setStoreConfig((prev) => ({ ...prev, storeDescription: e.target.value }))}
                      placeholder="Describe your jewelry store"
                      rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                      id="currency"
                      value={storeConfig.currency}
                      onChange={(e) => setStoreConfig((prev) => ({ ...prev, currency: e.target.value }))}
                      placeholder="USD"
                  />
                </div>

                {/* Logo upload field */}
                <div>
                  <Label htmlFor="logo">Store Logo (Optional)</Label>
                  <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />

                  {uploading && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm text-blue-600">
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading logo...
                          </div>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                  )}

                  {uploadError && <div className="mt-2 text-sm text-yellow-600">⚠️ {uploadError}</div>}

                  {storeConfig.logoUrl && (
                      <div className="mt-2">
                        <Image
                            src={storeConfig.logoUrl || "/placeholder.svg"}
                            alt="Logo preview"
                            width={64}
                            height={64}
                            className="h-16 w-auto object-contain"
                        />
                        <p className="text-xs text-green-600 mt-1">✅ Logo uploaded successfully</p>
                      </div>
                  )}

                  <p className="text-xs text-gray-500 mt-1">
                    Upload a logo for your store (PNG, JPG, SVG recommended).
                    {sftpReady ? " Will upload to SFTP server." : " Will store locally as fallback."}
                  </p>
                </div>
              </div>
            </div>
        )

      case "admin-account":
        return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-2">Admin Account</h2>
                <p className="text-gray-600">Create your administrator account to manage the store.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminFirstName">First Name</Label>
                    <Input
                        id="adminFirstName"
                        value={storeConfig.adminFirstName}
                        onChange={(e) => setStoreConfig((prev) => ({ ...prev, adminFirstName: e.target.value }))}
                        placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminLastName">Last Name</Label>
                    <Input
                        id="adminLastName"
                        value={storeConfig.adminLastName}
                        onChange={(e) => setStoreConfig((prev) => ({ ...prev, adminLastName: e.target.value }))}
                        placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="adminEmail">Email Address</Label>
                  <Input
                      id="adminEmail"
                      type="email"
                      value={storeConfig.adminEmail}
                      onChange={(e) => setStoreConfig((prev) => ({ ...prev, adminEmail: e.target.value }))}
                      placeholder="admin@yourstore.com"
                  />
                </div>

                <div>
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                      id="adminPassword"
                      type="password"
                      value={storeConfig.adminPassword}
                      onChange={(e) => setStoreConfig((prev) => ({ ...prev, adminPassword: e.target.value }))}
                      placeholder="Create a secure password"
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will create a real Firebase Auth account with admin privileges in your database.
                </AlertDescription>
              </Alert>
            </div>
        )

      case "database-setup":
        return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-2">Database Setup</h2>
                <p className="text-gray-600">
                  Initialize your Firestore database with the necessary collections and settings.
                </p>
              </div>

              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  This will create the following collections in your Firestore database:
                  <ul className="mt-2 space-y-1">
                    <li>
                      • <strong>products</strong> - Store your jewelry inventory
                    </li>
                    <li>
                      • <strong>orders</strong> - Customer orders and transactions
                    </li>
                    <li>
                      • <strong>users</strong> - Customer and admin accounts
                    </li>
                    <li>
                      • <strong>settings</strong> - Store configuration
                    </li>
                    <li>
                      • <strong>categories</strong> - Product categories
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              {firebaseError && (
                  <FirebaseRulesHelper
                      instructions={firebaseError.instructions}
                      rulesExample={firebaseError.rulesExample}
                  />
              )}

              <div className="text-center">
                <Button onClick={handleDatabaseSetup} disabled={loading} size="lg">
                  {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing Database...
                      </>
                  ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Initialize Database
                      </>
                  )}
                </Button>
              </div>
            </div>
        )

      case "demo-data":
        return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-2">Demo Products</h2>
                <p className="text-gray-600">Add sample jewelry products to showcase your store's capabilities.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Diamond Rings", count: "3 products" },
                  { name: "Pearl Earrings", count: "2 products" },
                  { name: "Gold Necklaces", count: "2 products" },
                  { name: "Tennis Bracelets", count: "1 product" },
                ].map((category, index) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-sm">{category.name}</h3>
                      <p className="text-xs text-gray-500">{category.count}</p>
                    </div>
                ))}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will add 8 sample jewelry products to your Firestore database with detailed specifications and
                  placeholder images. You can modify or replace these products later through the admin panel.
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <Button onClick={handleDemoDataSetup} disabled={loading} size="lg">
                  {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Demo Products...
                      </>
                  ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Add Demo Products
                      </>
                  )}
                </Button>
              </div>
            </div>
        )

      case "complete":
        return (
            <div className="text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-light tracking-wide text-gray-900 mb-4">Setup Complete!</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your jewelry store is now ready. You can start managing products, processing orders, and customizing
                  your store.
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-medium text-green-900 mb-4">What's Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <h4 className="font-medium text-green-800">Admin Tasks:</h4>
                    <ul className="text-green-700 space-y-1 mt-1">
                      <li>• Upload real product images</li>
                      <li>• Customize store settings</li>
                      <li>• Set up payment methods</li>
                      <li>• Configure shipping options</li>
                    </ul>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-green-800">Store Features:</h4>
                    <ul className="text-green-700 space-y-1 mt-1">
                      <li>• Product management</li>
                      <li>• Order processing</li>
                      <li>• Customer management</li>
                      <li>• File manager</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button onClick={completeSetup} disabled={loading} size="lg">
                  {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finalizing...
                      </>
                  ) : (
                      <>
                        Go to Admin Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                  )}
                </Button>
              </div>
            </div>
        )

      default:
        return null
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light tracking-wide text-gray-900 mb-2">Store Setup Wizard</h1>
            <p className="text-gray-600">Configure your luxury jewelry ecommerce store</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                  <div
                      key={step.id}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                          index === currentStep
                              ? "bg-gray-900 text-white"
                              : step.completed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {step.completed ? (
                        <CheckCircle className="h-4 w-4" />
                    ) : index === currentStep ? (
                        step.icon
                    ) : (
                        <Circle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <Card className="mb-8">
            <CardContent className="p-8">{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          {!setupComplete && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0 || loading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <div className="space-x-2">
                  {steps[currentStep]?.id === "store-config" && (
                      <Button onClick={handleStoreConfigSubmit} disabled={loading}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                  )}

                  {steps[currentStep]?.id === "admin-account" && (
                      <Button onClick={handleAdminAccountSubmit} disabled={loading}>
                        {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                        ) : (
                            <>
                              Create Account
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                      </Button>
                  )}

                  {steps[currentStep]?.id === "welcome" && (
                      <Button onClick={nextStep} disabled={loading}>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  )
}
