from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import zipfile
import io
from .models import db, Song

songs_bp = Blueprint("songs", __name__)

@songs_bp.route("/", methods=["POST"])
@jwt_required()
def add_song():
    user_id = get_jwt_identity()

    uploaded_file = request.files.get("file")

    if not uploaded_file:
        return jsonify({"msg": "No file uploaded"}), 400

    filename = uploaded_file.filename.lower()

    # --- Handle MXL ---
    if filename.endswith(".mxl"):
        zip_data = io.BytesIO(uploaded_file.read())
        with zipfile.ZipFile(zip_data) as z:
            musicxml_name = next(
                name for name in z.namelist()
                if name.endswith(".xml") or name.endswith(".musicxml")
            )
            content = z.read(musicxml_name).decode("utf-8")

    # --- Handle raw XML ---
    elif filename.endswith(".xml") or filename.endswith(".musicxml"):
        content = uploaded_file.read().decode("utf-8")

    else:
        return jsonify({"msg": "Unsupported file type"}), 400

    new_song = Song(
        content=content,
        user_id=user_id
    )

    db.session.add(new_song)
    db.session.commit()

    return jsonify({
        "msg": "Song added",
        "song": {"id": new_song.id}
    }), 201

@songs_bp.route("/", methods=["GET"])
@jwt_required()
def get_songs():
    user_id = get_jwt_identity()

    songs = Song.query.filter_by(user_id=user_id).all()

    result = [
        {
            "id": song.id,
            "content": song.content
        }
        for song in songs
    ]

    return jsonify(result), 200

@songs_bp.route("/<int:song_id>", methods=["GET"])
@jwt_required()
def get_song(song_id):
    user_id = get_jwt_identity()

    song = Song.query.filter_by(
        id=song_id,
        user_id=user_id
    ).first()

    if not song:
        return jsonify({"msg": "Song not found"}), 404

    return jsonify({
        "id": song.id,
        "content": song.content
    }), 200
