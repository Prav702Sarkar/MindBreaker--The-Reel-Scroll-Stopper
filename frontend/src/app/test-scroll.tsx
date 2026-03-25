// Test to verify ScrollAnimationWrapper logic

import React, { useEffect, useRef, useState } from 'react';

// This mimics the fixed ScrollAnimationWrapper
const TestScrollAnimation = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [intersectionStatus, setIntersectionStatus] = useState('not-observed');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('Intersection Observer triggered:', {
          isIntersecting: entry.isIntersecting,
          boundingClientRect: entry.boundingClientRect,
        });
        setIntersectionStatus(entry.isIntersecting ? 'visible' : 'hidden');

        // Clear any pending timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (entry.isIntersecting) {
          console.log('Element entered viewport, setting animation timeout...');
          timeoutRef.current = setTimeout(() => {
            console.log('Animation timeout fired, setting isVisible = true');
            setIsVisible(true);
            timeoutRef.current = null;
          }, 200); // Using 200ms for testing (delay = 0 in examples)
        } else {
          console.log('Element left viewport, resetting animation state');
          setIsVisible(false);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (ref.current) {
      console.log('Observing element:', ref.current);
      observer.observe(ref.current);
    }

    return () => {
      console.log('Cleanup: disconnecting observer');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="h-screen flex items-center justify-center bg-blue-100">
        <h1>Scroll down to see the animation</h1>
      </div>
      
      <div
        ref={ref}
        className={`h-96 bg-red-500 flex items-center justify-center text-white text-2xl font-bold transition-all duration-1000 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="text-center">
          <p>Animation Test Element</p>
          <p className="text-sm mt-2">Status: {intersectionStatus}</p>
          <p className="text-sm">Visible: {isVisible ? 'YES' : 'NO'}</p>
        </div>
      </div>

      <div className="h-screen flex items-center justify-center bg-green-100">
        <h1>Keep scrolling...</h1>
      </div>
    </div>
  );
};

export default TestScrollAnimation;
