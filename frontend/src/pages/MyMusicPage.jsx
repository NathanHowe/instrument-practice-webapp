import { useEffect } from "react";

function MyMusicPage() {
  useEffect(() => {
    fetch("http://127.0.0.1:5000/")
      .then(res => res.json())
      .then(data => console.log(data));
  }, []);

  return <h1>My Music Page</h1>;
}

export default MyMusicPage;
