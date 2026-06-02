from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import zipfile
import io
from .models import db, Song

songs_bp = Blueprint("songs", __name__)

@songs_bp.route("/", methods=["POST"])
@jwt_required()
def add_song():
    user_id = int(get_jwt_identity())

    uploaded_file = request.files.get("file")

    if not uploaded_file:
        return jsonify({"message": "No file uploaded"}), 400

    filename = uploaded_file.filename.lower()

    try:
        if filename.endswith(".mxl"):
            zip_data = io.BytesIO(uploaded_file.read())
            with zipfile.ZipFile(zip_data) as z:
                musicxml_name = next(
                    (
                        name for name in z.namelist()
                        if name.endswith(".xml") or name.endswith(".musicxml")
                    ),
                    None
                )
                if not musicxml_name:
                    return jsonify({"message": "No MusicXML file found inside .mxl"}), 400
                content = z.read(musicxml_name).decode("utf-8")

        elif filename.endswith(".xml") or filename.endswith(".musicxml"):
            content = uploaded_file.read().decode("utf-8")

        else:
            return jsonify({"message": "Unsupported file type. Use .mxl, .xml, or .musicxml"}), 400

    except zipfile.BadZipFile:
        return jsonify({"message": "The .mxl file appears to be corrupt"}), 400
    except Exception as e:
        return jsonify({"message": f"Failed to read file: {str(e)}"}), 400

    new_song = Song(content=content, user_id=user_id)
    db.session.add(new_song)
    db.session.commit()

    return jsonify({
        "message": "Song added",
        "song": {"id": new_song.id}
    }), 201

@songs_bp.route("/", methods=["GET"])
@jwt_required()
def get_songs():
    user_id = int(get_jwt_identity())

    songs = Song.query.filter_by(user_id=user_id).all()

    return jsonify([
        {"id": song.id, "content": song.content}
        for song in songs
    ]), 200


@songs_bp.route("/<int:song_id>", methods=["GET"])
@jwt_required()
def get_song(song_id):
    user_id = int(get_jwt_identity())

    song = Song.query.filter_by(id=song_id, user_id=user_id).first()

    if not song:
        return jsonify({"message": "Song not found"}), 404

    return jsonify({
        "id": song.id,
        "content": song.content
    }), 200

@songs_bp.route("/<int:song_id>", methods=["DELETE"])
@jwt_required()
def delete_song(song_id):
    user_id = int(get_jwt_identity())

    song = Song.query.filter_by(id=song_id, user_id=user_id).first()

    if not song:
        return jsonify({"message": "Song not found"}), 404

    db.session.delete(song)
    db.session.commit()

    return jsonify({"message": "Song deleted"}), 200