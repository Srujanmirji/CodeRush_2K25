import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import ProblemStatements from '../components/ProblemStatements';
import PrizesBenefits from '../components/PrizesBenefits';
import JudgingCriteria from '../components/JudgingCriteria';
import Timeline from '../components/Timeline';
import ThreeBackground from '../components/ThreeBackground';

const HomePage = () => {
    return (
        <div className="relative text-white min-h-screen bg-black selection:bg-cyber-pink selection:text-white overflow-x-hidden">
            <ThreeBackground />
            <div className="relative z-10 flex flex-col gap-20 sm:gap-32 pb-20">
                <Hero />
                <About />
                <ProblemStatements />
                <PrizesBenefits />
                <JudgingCriteria />
                <Timeline />
            </div>
        </div>
    );
};

export default HomePage;
