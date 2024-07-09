from flask import Flask, request, render_template, redirect, jsonify, url_for, session, flash
from twilio_config import send_otp, verify_otp
import sqlite3
import re
import bcrypt


app = Flask(__name__)
app.secret_key = '123456'


def get_db(name):
    db = sqlite3.connect(name)
    return db


def init_db():
    connection = sqlite3.connect('users.db')
    cursor = connection.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT,
            email TEXT,
            phone TEXT,
            password TEXT
        )
    ''')
    connection.commit()
    connection.close()


init_db()


def get_user_by_email(email):
    try:
        connection = sqlite3.connect('users.db')
        cursor = connection.cursor()
        query = "SELECT id, username, email, phone, password FROM users WHERE email = ?"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        connection.close()
        if user:
            return {
                'id': user[0],
                'name': user[1],
                'email': user[2],
                'phone': user[3],
                'password': user[4]
            }
        return None
    except sqlite3.Error as e:
        print(f"Error accessing SQLite database: {e}")
        return None


def get_user_by_phone(phone):
    try:
        connection = sqlite3.connect('users.db')
        cursor = connection.cursor()
        query = "SELECT id, username, email, phone, password FROM users WHERE phone = ?"
        cursor.execute(query, (phone,))
        user = cursor.fetchone()
        connection.close()
        if user:
            return {
                'id': user[0],
                'username': user[1],
                'email': user[2],
                'phone': user[3],
                'password': user[4]
            }
        return None
    except sqlite3.Error as e:
        print(f"Error accessing SQLite database: {e}")
        return None


def create_user(username, email, phone, password):
    if get_user_by_phone(phone):
        return False  # User already exists
    user_id = re.sub(r'\s+', '_', f"{username}_{phone}")
    connection = sqlite3.connect('users.db')
    cursor = connection.cursor()
    cursor.execute('''
        INSERT INTO users (id, username, email, phone, password)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, username, email, phone, password))
    connection.commit()
    connection.close()
    return True


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        phone = request.form['phone']
        password = request.form['password']
        password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        if create_user(username, email, phone, password):
            flash('Sign up successful! Please log in.', 'success')
            return redirect(url_for('login_email_password'))
        else:
            flash('Phone number already has an account.', 'danger')
            return redirect(url_for('signup'))
    return render_template('signup.html')


@app.route('/login_email_password',  methods=['GET', 'POST'])
def login_email_password():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = get_user_by_email(email)
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            session['user_id'] = user['id']
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password', 'danger')
            return redirect(url_for('login_email_password'))
    return render_template('login.html')


@app.route('/login_phone_otp',  methods=['GET', 'POST'])
def login_phone_otp():
    if request.method == 'POST':
        phone = request.form['phone']
        user = get_user_by_phone(phone)
        phone = '+91' + phone
        if user:
            session['user_id'] = user['id']
            send_otp(phone)
            session['phone'] = phone
            flash('OTP sent to your phone number.', 'info')
            return redirect(url_for('verify_otp_view'))
        else:
            flash('Phone number not found. Please sign up first.', 'danger')
            return redirect(url_for('signup'))
    return render_template('login.html')


@app.route('/verify_otp', methods=['GET', 'POST'])
def verify_otp_view():
    if request.method == 'POST':
        phone = session.get('phone')
        otp = request.form['otp']
        if verify_otp(phone, otp):
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid OTP', 'danger')
    return render_template('verify_otp.html')


@app.route('/logout')
def logout():
    print("a")
    session.pop('phone', None)
    session.pop('user_id', None)
    flash('You have been logged out.', 'info')
    return render_template('index.html', login_status=0)


@app.route('/albums', methods=['GET'])
def get_albums():
    topic = request.args.get('topic', '')
    # print(topic)
    db = get_db("music.db")
    if topic:
        cur = db.execute(
            'SELECT name, description, cover_img FROM album WHERE topic = ?', (topic,))
    else:
        cur = db.execute('SELECT name, description, cover_img FROM album')
    albums = cur.fetchall()
    return jsonify([{"name": row[0], "description": row[1], "cover_img": row[2]} for row in albums])


@app.route('/addPlaylist', methods=['POST'])
def add_playlist():
    if 'user_id' not in session:
        flash('You must be logged in to add a playlist.', 'danger')
        return redirect(url_for('login_email_password'))

    user_id = session['user_id']
    playlist_name = request.form.get('playlistName')
    description=request.form.get('playlistDescription')
    description=description+"|"+user_id+"_"+playlist_name

    if not playlist_name:
        flash('Playlist name cannot be empty.', 'danger')
        return redirect(url_for('home'))

    try:
        db = get_db("music.db")
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO album (name, description, cover_img, topic)
        VALUES (?, ?, ?,'Playlists Made by You')
        ''', (playlist_name,description))
        db.commit()
        flash('Playlist added successfully!', 'success')
    except sqlite3.Error as e:
        flash(f'Error adding playlist: {str(e)}', 'danger')
    finally:
        db.close()

    return redirect(url_for('home'))

@app.route('/songs/<album_name>', methods=['GET'])
def get_songs(album_name):
    # Construct the table name based on album_name
    table_name = f'songs_{album_name.lower().replace(" ", "_")}'

    # Get the database connection
    db = get_db("music.db")

    try:
        # Try to execute the SELECT query
        cur = db.execute(
            f'SELECT artistName, trackName, albumName, artworkUrl, audioUrl, explicit, duration FROM {table_name}')
        songs = cur.fetchall()

        # Format the songs into JSON if found
        if songs:
            return jsonify([{
                "artistName": row[0],
                "trackName": row[1],
                "albumName": row[2],
                "artworkUrl": row[3],
                "audioUrl": row[4],
                "explicit": row[5],
                "duration": row[6]
            } for row in songs])
        else:
            return jsonify([])  # Return an empty JSON array if no songs found

    except sqlite3.OperationalError as e:
        # Handle the case where the table doesn't exist
        print(f"Error fetching songs from table {table_name}: {str(e)}")
        return jsonify([])  # Return an empty JSON array


@app.route('/')
def home():
    if 'phone' in session or 'user_id' in session:
        return render_template('index.html', login_status=1)
    return render_template('index.html', login_status=0)


if __name__ == '__main__':
    app.run(debug=True)
