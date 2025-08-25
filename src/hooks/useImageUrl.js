import { useState, useEffect } from 'react'
import { getImageUrl } from '../utils/imageUtils'

/**
 * Custom hook for loading image URLs asynchronously
 * @param {Object} location - Location data object
 * @param {number} rowIndex - The index of the location in the filtered array
 * @param {string} segment - The current segment ('sublets' or 'exchanges')
 * @returns {Object} { imageUrl, loading, error }
 */
export const useImageUrl = (location, rowIndex = null, segment = 'sublets') => {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadImage = async () => {
      if (!location) {
        setImageUrl(null)
        setLoading(false)
        return
      }

      // Quick check for obvious cases where there's no image
      if (!location.Photo || location.Photo.trim() === '') {
        setImageUrl(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const url = await getImageUrl(location, rowIndex, segment)
        setImageUrl(url)
      } catch (err) {
        console.error('Error loading image:', err)
        setError(err.message)
        setImageUrl(null)
      } finally {
        setLoading(false)
      }
    }

    loadImage()
  }, [location, rowIndex, segment])

  return { imageUrl, loading, error }
}
