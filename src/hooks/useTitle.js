import {
  useLayoutEffect,
  useRef
} from 'react';

function useTitle(text) {
  useLayoutEffect(() => {
    document.title = text;
  }, [text])
  return text
}

export default useTitle