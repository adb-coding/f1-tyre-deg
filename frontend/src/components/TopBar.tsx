import { Menu, PanelRight } from 'lucide-react';

interface TopBarProps {
    onToggleSidebar: () => void;
    onToggleRightbar: () => void;
}

export function TopBar({ onToggleSidebar, onToggleRightbar } : TopBarProps) {
    
    const f1logo = '/images/logo.png'

    return (

    <div className="topbar">
        <button className='topbar__mobile-toggle' onClick={onToggleSidebar} aria-label='Menu'>
            <Menu size={24} />
        </button>
        
        <img className="img" src={f1logo} alt="F1 Logo" />
            <span style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase", fontSize: "14px" }}>F1 Data Analysis Dashboard</span>
        
        <button className='topbar__mobile-toggle' onClick={onToggleRightbar} aria-label='PanelRight'>
            <PanelRight size={24}/>
        </button>

        {/* <Github className="tobar-icon" size={24}/> */}
    </div>
    );
}