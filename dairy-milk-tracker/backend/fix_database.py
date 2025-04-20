# Database fix utility script
# Run with: python fix_database.py

import os
import sqlite3
import sys

def main():
    print("Dairy Milk Tracker - Database Fix Utility")
    print("=========================================")
    
    # Get database path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'dairy_milk_tracker.db')
    
    print(f"Looking for database at: {db_path}")
    
    # Check if database exists
    if not os.path.exists(db_path):
        print("\nDatabase file not found! A new one will be created when you start the application.")
        return
    
    # Connect to database
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        print("Successfully connected to database")
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        tables = [table[0] for table in tables]
        
        print(f"\nFound tables: {', '.join(tables)}")
        
        if 'users' not in tables or 'herds' not in tables:
            print("\nERROR: Essential tables are missing. Your database may be corrupted.")
            should_reset = input("Would you like to reset the database? (y/n): ")
            if should_reset.lower() == 'y':
                conn.close()
                os.remove(db_path)
                print("Database has been reset. A new one will be created when you start the application.")
                return
        
        # Check users table
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        print(f"\nUsers table columns: {', '.join(column_names)}")
        
        # Add username column if missing
        if 'username' not in column_names:
            print("\nAdding missing 'username' column to users table...")
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
                conn.commit()
                print("Column added successfully")
            except sqlite3.OperationalError as e:
                print(f"Error adding column: {e}")
        
        # Check herds table if it exists
        if 'herds' in tables:
            cursor.execute("PRAGMA table_info(herds)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            print(f"\nHerds table columns: {', '.join(column_names)}")
            
            # Add location columns if missing
            if 'location_line1' not in column_names:
                print("\nAdding missing 'location_line1' column to herds table...")
                try:
                    cursor.execute("ALTER TABLE herds ADD COLUMN location_line1 TEXT")
                    conn.commit()
                    print("Column added successfully")
                except sqlite3.OperationalError as e:
                    print(f"Error adding column: {e}")
            
            if 'location_line2' not in column_names:
                print("\nAdding missing 'location_line2' column to herds table...")
                try:
                    cursor.execute("ALTER TABLE herds ADD COLUMN location_line2 TEXT")
                    conn.commit()
                    print("Column added successfully")
                except sqlite3.OperationalError as e:
                    print(f"Error adding column: {e}")
        
        # Check milk_productions table if it exists
        if 'milk_productions' in tables:
            cursor.execute("PRAGMA table_info(milk_productions)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            print(f"\nMilk Productions table columns: {', '.join(column_names)}")
        
        # Set default usernames for existing users
        cursor.execute("SELECT id, email, username FROM users WHERE username IS NULL")
        users_without_username = cursor.fetchall()
        
        if users_without_username:
            print(f"\nFound {len(users_without_username)} users without a username")
            for user in users_without_username:
                user_id, email, _ = user
                print(f"Setting username for user ID {user_id} to '{email}'")
                cursor.execute("UPDATE users SET username = ? WHERE id = ?", (email, user_id))
            
            conn.commit()
            print("Updated all users successfully")
        
        # Final check
        print("\nDatabase structure looks good!")
        print("\nIf you continue to experience issues, please refer to TROUBLESHOOTING-DB.md")
    
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            print("\nDatabase connection closed")

if __name__ == "__main__":
    main()
