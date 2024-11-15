import os
# from dotenv import load_dotenv  # For loading environment variables from .env file
import mysql  # MySQL connector to interact with the database
from mysql.connector import Error  # Error handling for MySQL operations
# load_dotenv()  # Load environment variables like DB credentials
# Import values from csv(s) to df(s)
# persons_df = pd.read_csv('../data/alumni_names_titles_links_industries_companies_roles_32062.csv')
# education_df = pd.read_csv('../data/education.csv')
# experience_df = pd.read_csv('../data/experience.csv')
# Function to establish a connection to the MySQL database
def create_connection():
    connection = None
    try:
        # Attempt to connect using environment variables for DB credentials
        connection = mysql.connector.connect(
            host='34.44.42.132',
            user='hirehelper',
            password='hirehelper123!',
            database='hirehelper'
        )
        print("Successfully connected to the database")
    except Error as e:
        # Print detailed error information if connection fails
        print(f"Error connecting to MySQL: {e}")
    return connection
## CREATE TABLES
# Function to create the 'persons' table if it doesn't already exist
def create_person(connection):
    create_table_query = """
    CREATE TABLE IF NOT EXISTS person (
        person_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        industry VARCHAR(255),
        link VARCHAR(255),
        company VARCHAR(255),
        role VARCHAR(255)
    )
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(create_table_query)
            connection.commit()
            print("Table 'person' created successfully")
    except Error as e:
        print(f"Error creating table: {e}")

def create_education(connection):
    create_table_query = """
    CREATE TABLE IF NOT EXISTS education (
        education_id INT AUTO_INCREMENT PRIMARY KEY,
        person_id INT FOREIGN KEY
        school_name VARCHAR(255),
        degree VARCHAR(255),
        major VARCHAR(255),
        start_date date
        end_date date
    )
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(create_table_query)
            connection.commit()
            print("Table 'education' created successfully")
    except Error as e:
        print(f"Error creating table: {e}")
        

def create_experience(connection):
    create_table_query = """
    CREATE TABLE IF NOT EXISTS experience (
        experience_id INT AUTO_INCREMENT PRIMARY KEY
        person_id INT FOREIGN KEY
        company_name VARCHAR(255),
        location VARCHAR(255),
        position VARCHAR(255),
        start_date date
        end_date date
    )
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(create_table_query)
            connection.commit()
            print("Table 'experience' created successfully")
    except Error as e:
        print(f"Error creating table: {e}")
        
def create_connections(connection):
    create_table_query = """
    CREATE TABLE IF NOT EXISTS connections (
        connection_id INT AUTO_INCREMENT PRIMARY KEY
        person_id INT FOREIGN KEY
        connection_user_id INT FOREIGN KEY
    )
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(create_table_query)
            connection.commit()
            print("Table 'connections' created successfully")
    except Error as e:
        print(f"Error creating table: {e}")    
    
## ADD TO TABLES
# Function to add a new user to the 'persons' table
def add_person(connection, name, title, industry, link, company, role):
    query = """
    INSERT INTO person (name, title, industry, link, company, role)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (name, title, industry, link, company, role)
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            connection.commit()
            print(f"User added with ID: {cursor.lastrowid}")
    except Error as e:
        print(f"Error adding user: {e}")
# Function to add a new user to the 'education' table
def add_education(connection, person_id, school_name, degree, major, start_date, end_date):
    query = """
    INSERT INTO education (person_id, school_name, degree, major, start_date, end_date)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (person_id, school_name, degree, major, start_date, end_date)
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            connection.commit()
            print(f"Education added with ID: {cursor.lastrowid}")
    except Error as e:
        print(f"Error adding education: {e}")
        
        
# Function to add a new user to the 'experience' table
def add_experience(connection, person_id, company_name, location, position, start_date, end_date):
    query = """
    INSERT INTO experience (person_id, company_name, location, position, start_date, end_date)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (person_id, company_name, location, position, start_date, end_date)
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            connection.commit()
            print(f"User added with ID: {cursor.lastrowid}")
    except Error as e:
        print(f"Error adding user: {e}")
        
def add_connections(connection, connection_id, person_id, connection_user_id, connection_status):
    query = """
    INSERT INTO connections (connection_id, person_id, connection_user_id, connection_status)
    VALUES (%s, %s, %s, %s)
    """
    values = (connection_id, person_id, connection_user_id, connection_status)
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            connection.commit()
            print(f"Connection added with ID: {cursor.lastrowid}")
    except Error as e:
        print(f"Error adding connection: {e}")


# Function to retrieve and display all users from the 'person' table
def view_person(connection):
    query = "SELECT * FROM person"
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
            if not results:
                print("No persons found in the database.")
            else:
                for person in results:
                    print(f"\nID: {person[0]}")
                    print(f"Name: {person[1]}")
                    print(f"Title: {person[2]}")
                    print(f"Industry: {person[3]}")
                    print(f"link: {person[4]}")
                    print(f"company: {person[5]}")
                    print(f"role: {person[6]}")
    except Error as e:
        print(f"Error retrieving users: {e}")

# Function to retrieve and display all educations from the 'education' table
def view_education(connection):
    query = "SELECT * FROM education"
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
            if not results:
                print("No educations found in the database.")
            else:
                for education in results:
                    print(f"\nEducation ID: {education[0]}")
                    print(f"Person ID: {education[1]}")
                    print(f"School Name: {education[2]}")
                    print(f"Degree: {education[3]}")
                    print(f"Major: {education[4]}")
                    print(f"Start Date: {education[5]}")
                    print(f"End Date: {education[6]}")
    except Error as e:
        print(f"Error retrieving education: {e}")

def view_connections(connection):
    query = "SELECT * FROM connections"
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
            if not results:
                print("No connections found in the database.")
            else:
                for conn in results:
                    print(f"\nConnection ID: {conn[0]}")
                    print(f"Person ID: {conn[1]}")
                    print(f"Connection User ID: {conn[2]}")
                    print(f"Connection Status: {conn[3]}")
    except Error as e:
        print(f"Error retrieving education: {e}")

def view_experience(connection):
    query = "SELECT * FROM experience"
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
            if not results:
                print("No experiences found in the database.")
            else:
                for exp in results:
                    print(f"\nExperience ID: {exp[0]}")
                    print(f"Person ID: {exp[1]}")
                    print(f"Company: {exp[2]}")
                    print(f"Location: {exp[3]}")
                    print(f"Position: {exp[4]}")
                    print(f"Start Date: {exp[5]}")
                    print(f"End Date: {exp[6]}")
    except Error as e:
        print(f"Error retrieving education: {e}")

# Function to delete a person by their ID from the 'person' table
def delete_person(connection, id):
    query = "DELETE FROM person WHERE id = %s"
    value = (id,)
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, value)
            connection.commit()
            if cursor.rowcount:
                print("Person deleted successfully!")
            else:
                print("No person found with that ID.")
    except Error as e:
        print(f"Error deleting person: {e}")

# Function to delete a education by their ID from the 'education' table
def delete_education(connection, id):
    query = "DELETE FROM education WHERE id = %s"
    value = (id,)
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, value)
            connection.commit()
            if cursor.rowcount:
                print("education deleted successfully!")
            else:
                print("No education found with that ID.")
    except Error as e:
        print(f"Error deleting contact: {e}")

# Main function to establish the database connection and create necessary tables
def main():
    connection = create_connection()  
    if connection is None:
        return  # Exit if connection fails
    create_person(connection)  # Ensure 'person' table exists
    # create_education(connection) # Ensure 'education' table exists
    # create_experience(connection)  # Ensure 'experience' table exists
    ## ADD REAL VALUES FROM IMPORTED CSVs
    # Iterate over each row in persons data frame and add to persons
    for index, row in persons_df.iloc[13906:].iterrows():
        add_person(connection,
                    row['Name'],
                    row['Title'],
                    row['Industry'],
                    row['Link'],
                    row['Company'],
                    row['Role'],
                    )
    
    # # Iterate over each row in education data frame and add to education
    # for index, row in experience_df.iterrows():
    #     add_experience(connection,
    #                 index,
    #                 row['company_name'],
    #                 row['location'],
    #                 row['position'],
    #                 row['start_date'],
    #                 row['end_date'],)
    # # Iterate over each row in experience data frame and add to experience
    # for index, row in education_df.iterrows():
    #     add_education(connection,
    #                 index,
    #                 row['school_name'],
    #                 row['degree'],
    #                 row['major'],
    #                 row['start_date'],
    #                 row['end_date'],)
    
    # view_person(connection)
    # view_education(connection)
    # view_experience(connection)
    # view_connections(connection)

    connection.close()  

if __name__ == "__main__":
    main()  