"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";

const ADMIN_EMAIL = "anshuman91205@gmail.com"; // ✅ your current logged email

export default function Admin() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // 🔐 Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Logged user:", currentUser?.email);

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      const email = currentUser.email?.toLowerCase().trim();
      const admin = ADMIN_EMAIL.toLowerCase().trim();

      if (email !== admin) {
        alert("Not authorized ❌");
        router.replace("/");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 🖼️ Upload multiple images + save product
  const handleAddProduct = async () => {
    if (!name || !price || imageFiles.length === 0) {
      alert("Fill all fields");
      return;
    }

    try {
      const imageUrls: string[] = [];

      // Upload each image
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "urban_dhaga_upload");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/duboa8gss/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();

        if (data.secure_url) {
          imageUrls.push(data.secure_url);
        } else {
          console.error("Upload error:", data);
        }
      }

      // Save product
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        images: imageUrls, // ✅ multiple images
        category,
      });

      alert("Product Added ✅");

      // Reset
      setName("");
      setPrice("");
      setCategory("");
      setImageFiles([]);

    } catch (error) {
      console.error(error);
      alert("Error uploading product");
    }
  };

  // ⏳ Loading state
  if (loading) {
    return <div className="p-10 text-center">Checking access...</div>;
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel 🔐</h1>

      <p className="mb-4 text-sm text-gray-600">
        Logged in as: {user?.email}
      </p>

      {/* Product Name */}
      <input
        className="border p-2 w-full mb-3"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Price */}
      <input
        className="border p-2 w-full mb-3"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      {/* Multiple Image Upload */}
      <input
        type="file"
        multiple
        className="border p-2 w-full mb-3"
        onChange={(e) => {
          if (e.target.files) {
            setImageFiles(Array.from(e.target.files));
          }
        }}
      />

      {/* Category */}
      <input
        className="border p-2 w-full mb-3"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      {/* Add Product */}
      <button
        onClick={handleAddProduct}
        className="bg-black text-white px-4 py-2 w-full rounded"
      >
        Add Product
      </button>

      {/* Logout */}
      <button
        onClick={() => signOut(auth)}
        className="mt-4 w-full text-red-500"
      >
        Logout
      </button>
    </div>
  );
}
