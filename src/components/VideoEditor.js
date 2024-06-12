import { useMemo, useState } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({
  log: true,
});

const VideoEditor = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [text, setText] = useState('');
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [t, setT] = useState(1);
  const [d, setD] = useState(5);
  const [s, setS] = useState(20);
  const [outputVideo, setOutputVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVideoChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleVideoEdit = async () => {
    try {
      setIsLoading(true);
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }
      ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));

      const fontFile = await fetch('/Arial.ttf').then((res) =>
        res.arrayBuffer()
      );
      ffmpeg.FS('writeFile', 'Arial.ttf', new Uint8Array(fontFile));

      const textFilter = `drawtext=fontfile=Arial.ttf:text='${text}':x=${x}:y=${y}:fontsize=${s}:fontcolor=white:enable='between(t,${t},${
        t + d
      })'`;
      await ffmpeg.run('-i', 'input.mp4', '-vf', textFilter, 'output.mp4');

      const data = ffmpeg.FS('readFile', 'output.mp4');
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' })
      );
      setOutputVideo(url);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing video:', error);
    }
  };

  const videosrc = useMemo(() => {
    return videoFile ? URL.createObjectURL(videoFile) : null;
  }, [videoFile]);

  const outputVideoSrc = useMemo(() => {
    return outputVideo ? outputVideo : null;
  }, [outputVideo]);
  return (
    <div className='flex flex-col gap-4  items-center mb-4'>
      <div className='flex flex-col gap-3 items-center'>
        <input
          className='w-full border rounded'
          onChange={handleVideoChange}
          type='file'
          accept='video/*'
        />
        <div className='flex flex-wrap gap-2'>
          <div>
            <label className='font-bold mr-2'>Enter Text:</label>
            <input
              type='text'
              onChange={(e) => setText(e.target.value)}
              value={text}
              className='border rounded p-1'
              placeholder='Enter some text...'
            />
          </div>
          <div>
            <label className='font-bold mr-2'>X:</label>
            <input
              type='number'
              onChange={(e) => setX(+e.target.value)}
              value={x}
              className='border rounded p-1'
              placeholder='X'
            />
          </div>
          <div>
            <label className='font-bold mr-2'>Y:</label>
            <input
              type='number'
              onChange={(e) => setY(+e.target.value)}
              value={y}
              className='border rounded p-1'
              placeholder='Y'
            />
          </div>
          <div>
            <label className='font-bold mr-2'>T:</label>
            <input
              type='number'
              onChange={(e) => setT(+e.target.value)}
              value={t}
              className='border rounded p-1'
              placeholder='T'
            />
          </div>
          <div>
            <label className='font-bold mr-2'>D:</label>
            <input
              type='number'
              onChange={(e) => setD(+e.target.value)}
              value={d}
              className='border rounded p-1'
              placeholder='D'
            />
          </div>
          <div>
            <label className='font-bold mr-2'>S:</label>
            <input
              type='number'
              onChange={(e) => setS(+e.target.value)}
              value={s}
              className='border rounded p-1'
              placeholder='S'
            />
          </div>
        </div>
        <button
          onClick={handleVideoEdit}
          className='rounded bg-blue-300 py-1 px-4 w-52'
          disabled={!videoFile || !text || !x || !y || !t || !d || !s}
        >
          Add text to video
        </button>
      </div>
      {videoFile && (
        <video controls width='600' className='h-80' src={videosrc} />
      )}

      {isLoading && <h1 className='font-bold'>Processing...</h1>}
      {!isLoading && outputVideo && (
        <>
          <h1 className='text-lg font-bold'>Output video:</h1>
          <video
            controls
            width='600'
            height='400'
            className='h-80'
            src={outputVideoSrc}
          />
          <a
            href={outputVideoSrc}
            download='output.mp4'
            className='font-medium text-blue-600 hover:underline'
          >
            Download Edited Video
          </a>
        </>
      )}
    </div>
  );
};

export default VideoEditor;
