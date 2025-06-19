import { useThemeStore } from '@/store/useThemeStore'

interface BouncingLoaderProps {
  size?: 'sm' | 'md' | 'lg'
}

const BouncingLoader: React.FC<BouncingLoaderProps> = ({ size = 'md' }) => {
  const { theme } = useThemeStore()

  const sizeMap = {
    sm: {
      wrapper: 'w-32 h-10',
      circle: 'w-3 h-3',
      shadow: 'w-3 h-1 top-10',
    },
    md: {
      wrapper: 'w-48 h-14',
      circle: 'w-5 h-5',
      shadow: 'w-5 h-1 top-[3.75rem]',
    },
    lg: {
      wrapper: 'w-64 h-20',
      circle: 'w-7 h-7',
      shadow: 'w-7 h-1.5 top-[5.5rem]',
    },
  }

  const selectedSize = sizeMap[size]

  const content = (
    <>
      <div className={`relative z-10 ${selectedSize.wrapper}`}>
        <div
          className={`absolute rounded-full bg-primary ${selectedSize.circle} left-[15%] transform-gpu animate-bounce-up`}
        />
        <div
          className={`absolute rounded-full bg-primary ${selectedSize.circle} left-[45%] transform-gpu animate-bounce-up-delay-200`}
        />
        <div
          className={`absolute rounded-full bg-primary ${selectedSize.circle} right-[15%] transform-gpu animate-bounce-up-delay-300`}
        />

        <div
          className={`absolute rounded-full bg-base-content/40 blur-[1px] ${selectedSize.shadow} left-[15%] transform-gpu animate-shadow`}
        />
        <div
          className={`absolute rounded-full bg-base-content/40 blur-[1px] ${selectedSize.shadow} left-[45%] transform-gpu animate-shadow-delay-200`}
        />
        <div
          className={`absolute rounded-full bg-base-content/40 blur-[1px] ${selectedSize.shadow} right-[15%] transform-gpu animate-shadow-delay-300`}
        />
      </div>
      <style>{`
        @keyframes bounceUp {
          0% {
            top: 60px;
            height: 5px;
            border-radius: 50px 50px 25px 25px;
            transform: scaleX(1.7);
          }
          40% {
            height: 20px;
            border-radius: 50%;
            transform: scaleX(1);
          }
          100% {
            top: 0%;
          }
        }

        @keyframes shadow {
          0% {
            transform: scaleX(1.5);
          }
          40% {
            transform: scaleX(1);
            opacity: 0.7;
          }
          100% {
            transform: scaleX(0.2);
            opacity: 0.4;
          }
        }

        .animate-bounce-up {
          animation: bounceUp 0.5s alternate infinite ease;
        }
        .animate-bounce-up-delay-200 {
          animation: bounceUp 0.5s alternate infinite ease;
          animation-delay: -0.2s;
        }
        .animate-bounce-up-delay-300 {
          animation: bounceUp 0.5s alternate infinite ease;
          animation-delay: -0.3s;
        }

        .animate-shadow {
          animation: shadow 0.5s alternate infinite ease;
        }
        .animate-shadow-delay-200 {
          animation: shadow 0.5s alternate infinite ease;
          animation-delay: -0.2s;
        }
        .animate-shadow-delay-300 {
          animation: shadow 0.5s alternate infinite ease;
          animation-delay: -0.3s;
        }
      `}</style>
    </>
  )

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-base-100"
      data-theme={theme}
    >
      <div className="flex flex-col items-center justify-center">{content}</div>
    </div>
  )
}

export default BouncingLoader
