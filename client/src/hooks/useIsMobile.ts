import useMediaQuery from './useMediaQuery'

const useIsMobile = () => {
  return useMediaQuery('(max-width: 1023px)')
}

export default useIsMobile
