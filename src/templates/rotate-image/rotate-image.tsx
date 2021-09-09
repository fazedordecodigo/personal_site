import * as React from 'react'
import './rotate-image.scss';

export type RotateImageProps = {
  widthAndHeight: number | string,
  primary: string,
  secondary: string,
  cycleInSeconds: number,
  lightColor: string
};

export const RotateImage = (props: RotateImageProps) => {
  return (
    <div className="rotate-image">
      <div className="container" style={ {
          width: props.widthAndHeight,
          height: props.widthAndHeight
      } }>
        <div className="primary" style={ {
          width: props.widthAndHeight,
          height: props.widthAndHeight,
          backgroundImage: `url(${props.primary})`,
          animation: `spinner ${props.cycleInSeconds}s linear infinite, showing 6s`,
          boxShadow: `0px 0px 15px 0px rgba(255,255,255,0.5), 0px 0px 150px 0px ${props.lightColor}, inset 0px 0px 10px 0px black`
        } }>
          <div className="secondary" style={ { 
            width: props.widthAndHeight,
            height: props.widthAndHeight,
            backgroundImage: `url(${props.secondary})`,
            animation: `hide ${props.cycleInSeconds}s linear infinite`
          } }>
          </div>
        </div>
      </div>
    </div>
  )
}
