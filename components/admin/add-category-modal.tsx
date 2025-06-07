"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface AddCategoryModalProps {
    isOpen: boolean
    onClose: () => void
    onCategoryAdded: (category: { id: string; name: string; slug: string }) => void
}

export function AddCategoryModal({ isOpen, onClose, onCategoryAdded }: AddCategoryModalProps) {
    const { toast } = useToast()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [nameError, setNameError] = useState("")

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, "") // Remove special characters
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    }

    const handleSubmit = async () => {
        // Validate
        if (!name.trim()) {
            setNameError("Category name is required")
            return
        }
        setNameError("")

        setIsSubmitting(true)
        try {
            const slug = generateSlug(name)

            const response = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    slug,
                    description: description.trim(),
                }),
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Category added successfully",
                })
                onCategoryAdded({
                    id: result.category.id,
                    name: name.trim(),
                    slug,
                })
                handleClose()
            } else {
                throw new Error(result.error || "Failed to add category")
            }
        } catch (error: any) {
            console.error("Error adding category:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to add category",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setName("")
        setDescription("")
        setNameError("")
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                        Create a new product category. This will be available immediately for product assignment.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="flex items-center justify-between">
                            Category Name*
                            {nameError && <span className="text-xs text-red-500">{nameError}</span>}
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                if (e.target.value.trim()) setNameError("")
                            }}
                            placeholder="e.g. Bracelets"
                            className={nameError ? "border-red-500" : ""}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="slug">Slug (auto-generated)</Label>
                        <Input id="slug" value={generateSlug(name)} disabled className="bg-gray-50 text-gray-500" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe this category..."
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            "Add Category"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
