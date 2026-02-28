import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DEMO_EMAIL = 'demo@sigapai.com';
const DEMO_PASSWORD = 'demo1234';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
                localStorage.setItem('sigap_logged_in', 'true');
                navigate('/');
            } else {
                setError('Invalid email or password. Try the demo account.');
                setLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-stretch bg-background-dark font-display overflow-hidden">
            {/* Left Side: Branding */}
            <div className="hidden lg:flex flex-1 flex-col relative justify-center p-12 lg:p-20 overflow-hidden bg-[#0d121c]">
                {/* Background */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1617791160505-6f00504e3caf?q=80&w=2532&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>
                <div className="absolute right-0 top-1/4 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]"></div>

                <div className="relative z-10 flex flex-col gap-8 max-w-xl">
                    {/* Logo + Name */}
                    <div className="inline-flex items-center gap-3">
                        <img src="/logo-sigap.png" alt="Sigap AI" className="h-10 w-10 object-contain" />
                        <span className="text-2xl font-bold tracking-tight text-white">Sigap AI</span>
                    </div>

                    <div className="space-y-6">
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-md">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                            Traffic AI Manager v2.0
                        </div>

                        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white">
                            Smarter journeys <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">start here.</span>
                        </h1>

                        <p className="text-lg text-slate-400 leading-relaxed max-w-md">
                            Transforming every red light into a smarter journey for you and your community with real-time analytics and predictive modeling.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 pt-8 border-t border-white/10 mt-4">
                        <div>
                            <p className="text-3xl font-bold text-white">98%</p>
                            <p className="text-sm text-slate-500 mt-1">Efficiency Rate</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">24/7</p>
                            <p className="text-sm text-slate-500 mt-1">Live Monitoring</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">50+</p>
                            <p className="text-sm text-slate-500 mt-1">Cities Connected</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 relative bg-background-dark">
                {/* Mobile Background */}
                <div className="absolute inset-0 lg:hidden z-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                    <div className="absolute inset-0 bg-background-dark/90 backdrop-blur-sm"></div>
                </div>

                <div className="w-full max-w-[480px] relative z-10">
                    {/* Glass Card */}
                    <div className="bg-[#1a2333]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8 sm:p-10 shadow-2xl">
                        <div className="mb-10 text-center lg:text-left">
                            {/* Mobile Logo */}
                            <div className="lg:hidden flex justify-center mb-6">
                                <img src="/logo-sigap.png" alt="Sigap AI" className="h-12 w-12 object-contain" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Log in</h2>
                            <p className="text-slate-400">Enter your credentials to access the dashboard.</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                                <span className="material-symbols-outlined text-[20px]">error</span>
                                {error}
                            </div>
                        )}

                        {/* Demo Account Hint */}
                        <div className="mb-6 flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm">
                            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
                            <div>
                                <p className="text-primary font-medium mb-1">Demo Account</p>
                                <p className="text-slate-400 text-xs">Email: <span className="text-slate-300 font-mono">demo@sigapai.com</span></p>
                                <p className="text-slate-400 text-xs">Password: <span className="text-slate-300 font-mono">demo1234</span></p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-slate-300 ml-1">Email or Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">mail</span>
                                    </div>
                                    <input
                                        id="email"
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full h-12 pl-11 pr-4 bg-[#0f1521]/50 text-white placeholder-slate-500 border border-white/10 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label htmlFor="password" className="text-sm font-medium text-slate-300">Password</label>
                                    <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Forget Password?</a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-12 pl-11 pr-12 bg-[#0f1521]/50 text-white placeholder-slate-500 border border-white/10 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-slate-500 hover:text-slate-300 transition-colors text-[20px]">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(19,91,236,0.3)] hover:shadow-[0_0_25px_rgba(19,91,236,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <span>Log in</span>
                                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative flex py-8 items-center">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">Or continue with</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-3 h-12 bg-[#232f48] hover:bg-[#2c3b59] border border-white/5 rounded-lg text-white transition-all hover:scale-[1.02]">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="text-sm font-medium">Google</span>
                            </button>
                            <button className="flex items-center justify-center gap-3 h-12 bg-[#232f48] hover:bg-[#2c3b59] border border-white/5 rounded-lg text-white transition-all hover:scale-[1.02]">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span className="text-sm font-medium">Facebook</span>
                            </button>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-slate-400 text-sm">
                                New in Sigap AI?{' '}
                                <Link to="/signup" className="text-primary hover:text-primary/80 font-medium ml-1 transition-colors">Sign up</Link>
                            </p>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-8 flex justify-center gap-6 text-xs text-slate-500">
                        <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">Help Center</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
