import { FaGithub } from 'react-icons/fa';

export function Footer(){

    return (
        <footer className="footer">
                Made with FastF1
                <div className="footer_links">
                    <a href='https://github.com/adb-coding/f1-tyre-deg' target="_blank" rel="noopener norefferer">
                        <FaGithub /> Source
                    </a>
                    - 
                    <a href='https://formual1.com' target='_blank' rel="noopener noreferrer">formula1.com</a>
                </div>
                <p>
                    Unofficial project, not affiliated with Formula 1.
                </p>
        </footer>
    )
}
