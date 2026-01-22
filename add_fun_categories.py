#!/usr/bin/env python3
"""
Script to add Fun category type examples to the database.
Run this after logging in to create fun categories.
"""
import requests
import json

API_URL = "http://localhost:8000"

# You'll need to get your token from localStorage after logging in
# This is just a helper script - run these commands in your browser console
# or use the Categories page to create them

fun_categories = [
    {
        "name": "Entertainment",
        "type": "fun",
        "icon": "🎬",
        "color": "#FF6B9D"
    },
    {
        "name": "Dining Out",
        "type": "fun",
        "icon": "🍽️",
        "color": "#FFA07A"
    },
    {
        "name": "Travel",
        "type": "fun",
        "icon": "✈️",
        "color": "#87CEEB"
    },
    {
        "name": "Hobbies",
        "type": "fun",
        "icon": "🎨",
        "color": "#98D8C8"
    },
    {
        "name": "Gaming",
        "type": "fun",
        "icon": "🎮",
        "color": "#9B6CFF"
    },
    {
        "name": "Events",
        "type": "fun",
        "icon": "🎉",
        "color": "#FFD700"
    }
]

def main():
    print("Fun Categories to Create:")
    print("=" * 50)
    for cat in fun_categories:
        print(f"\n{cat['icon']} {cat['name']}")
        print(f"   Type: {cat['type']}")
        print(f"   Color: {cat['color']}")
    
    print("\n" + "=" * 50)
    print("\nTo create these categories:")
    print("1. Log in to your app at http://localhost:3000/login")
    print("2. Go to the Database page")
    print("3. Use the Categories section to create these fun categories")
    print("\nOr use this curl command (replace YOUR_TOKEN with your actual token):")
    print("\nfor category in Entertainment 'Dining Out' Travel Hobbies Gaming Events; do")
    print("  curl -X POST http://localhost:8000/api/categories/ \\")
    print("    -H 'Content-Type: application/json' \\")
    print("    -H 'Authorization: Bearer YOUR_TOKEN' \\")
    print("    -d '{\"name\": \"'$category'\", \"type\": \"fun\", \"icon\": \"🎉\", \"color\": \"#FFD700\"}'")
    print("done")

if __name__ == "__main__":
    main()
