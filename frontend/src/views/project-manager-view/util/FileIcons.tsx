import pythonIcon from '@/assets/python.png';
import qasmIcon from '@/assets/qasm.png';
import qrispIcon from '@/assets/qrisp.png';
import { FileCode, FileJson } from 'lucide-react';

export const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const iconClass = 'w-3 h-3 object-contain';

    switch (extension) {
        case 'py':
            return <img src={pythonIcon} alt="Python" className={iconClass} />;
        case 'qasm':
            return <img src={qasmIcon} alt="OpenQASM" className={iconClass} />;
        case 'qrisp':
            return <img src={qrispIcon} alt="Qrisp" className={iconClass} />;
        case 'json':
            return <FileJson className="w-3 h-3" />;
        default:
            return <FileCode className="w-3 h-3" />;
    }
};
