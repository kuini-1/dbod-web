'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';

export default function LoginPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    
    // Show persisted logs on login page
    useEffect(() => {
        const logs = localStorage.getItem('authLogs');
        if (logs) {
            try {
                const logArray = JSON.parse(logs);
                console.log('=== Authentication Debug Logs ===');
                logArray.forEach((log: any) => {
                    console.log(`[${log.time}] ${log.message}`);
                });
                console.log('=== End Debug Logs ===');
            } catch (e) {
                console.error('Error parsing logs:', e);
            }
        }
    }, []);

    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            console.log('Attempting login with:', data);
            const res = await API.post("/auth/login", data);
            console.log('Login response:', res);
            
            if (res.status !== 201) {
                alert(`Error: ${res.data.message}`);
                return;
            }
            
            // Get token from response
            const token = res.data.token;
            
            console.log('[Login] Token received, length:', token?.length);
            
            // Store token in localStorage
            localStorage.setItem('authToken', token);
            
            // Set cookie manually to ensure it's available immediately
            // The server also sets it, but this ensures it's available client-side
            // Don't URL encode - set raw token (middleware handles decoding)
            const cookieString = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
            document.cookie = cookieString;
            
            // Verify cookie was set
            const cookieCheck = document.cookie.split(';').some(c => c.trim().startsWith('token='));
            console.log('[Login] Cookie set:', cookieCheck);
            console.log('[Login] Cookie value exists:', document.cookie.includes('token='));
            
            // Double-check by reading the cookie back
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);
            console.log('[Login] Cookie token value length:', cookies.token?.length || 0);
            
            // Wait a moment for the cookie to be set and propagate
            setTimeout(async () => {
                try {
                    // Verify cookie was set
                    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                        const [key, value] = cookie.trim().split('=');
                        acc[key] = value;
                        return acc;
                    }, {} as Record<string, string>);
                    console.log('[Login] Cookie verification:', !!cookies.token);
                    
                    // Get user data from private endpoint to verify authentication works
                    const accountRes = await API.get("/private");
                    console.log('[Login] Private endpoint response status:', accountRes.status);
                    
                    if (accountRes.status === 201 || accountRes.status === 200) {
                        // Dispatch custom event to notify navbar of login
                        window.dispatchEvent(new Event('user-logged-in'));
                        
                        // Check if there's a redirect parameter
                        const urlParams = new URLSearchParams(window.location.search);
                        const redirect = urlParams.get('redirect');
                        
                        console.log('[Login] Redirect target:', redirect || '/donate');
                        
                        if (redirect) {
                            // Use window.location to ensure cookies are sent
                            window.location.href = redirect;
                        } else {
                            router.push('/donate');
                        }
                    } else {
                        console.error('[Login] Private endpoint failed:', accountRes);
                        alert('Login successful but could not get account data. Please try again.');
                        setLoading(false);
                    }
                } catch (privateError) {
                    console.error('[Login] Error accessing private endpoint:', privateError);
                    alert('Login successful but could not verify account. Please try again.');
                    setLoading(false);
                }
            }, 300);
            
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="text-white bg-stone-900 min-h-screen duration-500 overflow-x-hidden flex justify-center items-center px-4">
            <div className="w-full max-w-md">
                <div className="rounded-lg p-6 md:p-10 bg-stone-800/90 flex flex-col space-y-6">
                    <h1 className="text-3xl md:text-5xl font-bold text-center text-red-400">{local.login}</h1>
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
                        <div className="space-y-2">
                            <input 
                                className="rounded-md p-3 w-full bg-stone-700 text-white placeholder:text-stone-400 text-lg focus:outline-none focus:ring-2 focus:ring-red-400" 
                                type="text" 
                                id="username" 
                                placeholder={local.username} 
                                autoFocus 
                                {...register("username", { required: true, minLength: 2, maxLength: 16 })} 
                            />
                            {errors.username && <p className='text-red-400 text-sm'>{local.usernameError}</p>}
                        </div>
                        <div className="space-y-2">
                            <input 
                                className="rounded-md p-3 w-full bg-stone-700 text-white placeholder:text-stone-400 text-lg focus:outline-none focus:ring-2 focus:ring-red-400" 
                                type="password" 
                                id="password" 
                                placeholder={local.password} 
                                {...register("password", { required: true, minLength: 2, maxLength: 16 })} 
                            />
                            {errors.password && <p className='text-red-400 text-sm'>{local.passwordError}</p>}
                        </div>
                        <button 
                            className="rounded-md p-3 w-full bg-red-400 hover:bg-red-500 text-white font-bold text-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : local.login}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
