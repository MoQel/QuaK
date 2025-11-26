import React from 'react';

export const LogIn: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6">Projects</h1>
            <p className="text-lg text-gray-600">
                Welcome to the Projects page. Here you can view and manage all your quantum computing projects.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
                    <h2 className="text-xl font-semibold mb-2">Sample Project 1</h2>
                    <p className="text-gray-600">Description of your first project</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
                    <h2 className="text-xl font-semibold mb-2">Sample Project 2</h2>
                    <p className="text-gray-600">Description of your second project</p>
                </div>
            </div>
        </div>
    );
};

export default LogIn;

