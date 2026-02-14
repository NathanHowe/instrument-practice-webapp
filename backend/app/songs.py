from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, Song

songs_bp = Blueprint("songs", __name__)

@songs_bp.route("/", methods=["POST"])
@jwt_required()
def add_song():
    user_id = get_jwt_identity()
    data = request.get_json()

    title = data.get("title")
    content = data.get("content")

    new_song = Song(
        title=title,
        content=content,
        user_id=user_id
    )

    db.session.add(new_song)
    db.session.commit()

    return jsonify({"msg": "Song added", "song": {"id": new_song.id, "title": new_song.title}}), 201


@songs_bp.route("/", methods=["GET"])
@jwt_required()
def get_songs():
    user_id = get_jwt_identity()

    songs = Song.query.filter_by(user_id=user_id).all()

    result = [
        {
            "id": song.id,
            "title": song.title,
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
        "title": song.title,
        "content": song.content
    }), 200
