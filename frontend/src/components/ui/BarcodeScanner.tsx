import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Camera, X, Scan, Search, Globe, Package } from 'lucide-react';
import Quagga from 'quagga';

interface BarcodeData {
  code: string;
  format: string;
}

interface ProductInfo {
  title?: string;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  upc?: string;
  ean?: string;
  manufacturer?: string;
  model?: string;
  mpn?: string;
  price?: number;
  weight?: string;
  dimensions?: string;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string, productInfo?: ProductInfo) => void;
  currentBarcode?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
  currentBarcode = ''
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerInitialized, setIsScannerInitialized] = useState(false);
  const [manualBarcode, setManualBarcode] = useState(currentBarcode);
  const [scanResult, setScanResult] = useState<BarcodeData | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('manual');
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setManualBarcode(currentBarcode);
  }, [currentBarcode]);

  useEffect(() => {
    if (isOpen && scannerMode === 'camera' && !isScannerInitialized) {
      // Clear any previous errors when starting camera mode
      setError(null);
      startCamera();
    }
    
    // Reset states when dialog closes
    if (!isOpen) {
      setError(null);
      setScanResult(null);
      setProductInfo(null);
      setLoading(false);
      if (isScannerInitialized) {
        stopCamera();
      }
    }
    
    return () => {
      // Clean up on unmount or when dependencies change
      if (isScannerInitialized) {
        stopCamera();
      }
    };
  }, [isOpen, scannerMode, isScannerInitialized]);

  // Handle scanner mode changes
  useEffect(() => {
    if (scannerMode === 'manual' && isScannerInitialized) {
      stopCamera();
    }
  }, [scannerMode, isScannerInitialized]);

  const startCamera = () => {
    if (!scannerRef.current) {
      setError('Scanner container not available');
      return;
    }

    // Check if running in secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      setError('Camera access requires HTTPS. Please use a secure connection or localhost.');
      return;
    }

    // Don't start if already initialized
    if (isScannerInitialized) {
      return;
    }

    console.log('Starting camera scanner...');
    setError(null);
    setIsScanning(true);

    try {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment" // Use back camera
          }
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10,
        debug: {
          showCanvas: true,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showRemainingPatchLabels: false,
          boxFromPatches: {
            showTransformed: true,
            showTransformedBox: true,
            showBB: true
          }
        }
      }, (err: any) => {
        if (err) {
          console.error('Quagga initialization failed:', err);
          let errorMessage = 'Failed to initialize camera. ';
          if (err.name === 'NotAllowedError') {
            errorMessage += 'Camera permission denied. Please allow camera access and try again.';
          } else if (err.name === 'NotFoundError') {
            errorMessage += 'No camera found. Please connect a camera and try again.';
          } else if (err.name === 'NotSupportedError') {
            errorMessage += 'Camera not supported in this browser.';
          } else {
            errorMessage += 'Please check camera permissions and ensure you\'re using HTTPS.';
          }
          setError(errorMessage);
          setIsScanning(false);
          setIsScannerInitialized(false);
          return;
        }
        console.log("Initialization finished. Ready to start");
        try {
          Quagga.start();
          setIsScannerInitialized(true);
          console.log('Camera started successfully');
        } catch (startError) {
          console.error('Failed to start Quagga:', startError);
          setError('Failed to start camera scanner');
          setIsScanning(false);
          setIsScannerInitialized(false);
        }
      });

      Quagga.onDetected((result: any) => {
        console.log('Barcode detected:', result);
        const code = result.codeResult.code;
        const format = result.codeResult.format;
        
        setScanResult({ code, format });
        setManualBarcode(code);
        lookupProductInfo(code);
        stopCamera();
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      setError('Failed to start camera scanner. Please ensure camera permissions are granted.');
      setIsScanning(false);
      setIsScannerInitialized(false);
    }
  };

  const stopCamera = () => {
    try {
      if (Quagga && typeof Quagga.stop === 'function' && isScannerInitialized) {
        Quagga.stop();
        
        // Remove event listeners
        if (typeof Quagga.offDetected === 'function') {
          Quagga.offDetected();
        }
      }
    } catch (error) {
      console.warn('Error stopping camera:', error);
    } finally {
      setIsScanning(false);
      setIsScannerInitialized(false);
    }
  };

  const lookupProductInfo = async (barcode: string) => {
    if (!barcode || barcode.length < 8) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try multiple barcode lookup APIs
      const productData = await lookupFromMultipleSources(barcode);
      setProductInfo(productData);
    } catch (err) {
      console.error('Product lookup failed:', err);
      setError('Could not find product information for this barcode.');
    } finally {
      setLoading(false);
    }
  };

  const lookupFromMultipleSources = async (barcode: string): Promise<ProductInfo | null> => {
    const sources = [
      () => lookupFromOpenFoodFacts(barcode),
      () => lookupFromUPCDatabase(barcode),
      () => lookupFromBarcodeSpider(barcode)
    ];

    for (const source of sources) {
      try {
        const result = await source();
        if (result) return result;
      } catch (error) {
        console.log('Source failed, trying next...');
      }
    }

    return null;
  };

  const lookupFromOpenFoodFacts = async (barcode: string): Promise<ProductInfo | null> => {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      const product = data.product;
      return {
        title: product.product_name || product.product_name_en,
        brand: product.brands,
        category: product.categories,
        description: product.ingredients_text || product.generic_name,
        imageUrl: product.image_url,
        upc: barcode,
        manufacturer: product.manufacturing_places,
        weight: product.quantity
      };
    }
    return null;
  };

  const lookupFromUPCDatabase = async (barcode: string): Promise<ProductInfo | null> => {
    // Note: This would require an API key in production
    // For demo purposes, we'll use a mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: `Product ${barcode}`,
          description: 'Product information from UPC database',
          upc: barcode
        });
      }, 1000);
    });
  };

  const lookupFromBarcodeSpider = async (_barcode: string): Promise<ProductInfo | null> => {
    // Another mock source for demonstration
    return null;
  };

  const handleManualLookup = async () => {
    if (manualBarcode.trim()) {
      await lookupProductInfo(manualBarcode.trim());
    }
  };

  const handleConfirm = () => {
    if (manualBarcode.trim()) {
      onBarcodeDetected(manualBarcode.trim(), productInfo || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setScanResult(null);
    setProductInfo(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-blue-600" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={scannerMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScannerMode('manual')}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
            <Button
              variant={scannerMode === 'camera' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScannerMode('camera')}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera Scan
            </Button>
          </div>

          {/* Manual Entry Mode */}
          {scannerMode === 'manual' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter barcode manually..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleManualLookup}
                  disabled={loading || !manualBarcode.trim()}
                  size="sm"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Lookup
                </Button>
              </div>
            </div>
          )}

          {/* Camera Scanner Mode */}
          {scannerMode === 'camera' && (
            <div className="space-y-3">
              {!isScanning ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Click to start camera and scan barcode
                  </p>
                  <Button onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div 
                    ref={scannerRef} 
                    className="border rounded-lg overflow-hidden bg-black min-h-[300px]"
                  />
                  <Button
                    className="absolute top-2 right-2"
                    size="sm"
                    variant="secondary"
                    onClick={stopCamera}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/50 text-white text-sm p-2 rounded">
                      {isScannerInitialized ? 'Position barcode within the frame to scan' : 'Initializing camera...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Looking up product information...</p>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {scanResult.format.toUpperCase()}
                </Badge>
                <span className="font-mono text-sm">{scanResult.code}</span>
              </div>
            </div>
          )}

          {/* Product Information */}
          {productInfo && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-start gap-3">
                {productInfo.imageUrl ? (
                  <img 
                    src={productInfo.imageUrl} 
                    alt="Product" 
                    className="w-16 h-16 object-cover rounded border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  {productInfo.title && (
                    <h3 className="font-medium text-gray-900">{productInfo.title}</h3>
                  )}
                  {productInfo.brand && (
                    <p className="text-sm text-gray-600">Brand: {productInfo.brand}</p>
                  )}
                  {productInfo.category && (
                    <p className="text-sm text-gray-600">Category: {productInfo.category}</p>
                  )}
                  {productInfo.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{productInfo.description}</p>
                  )}
                  {productInfo.weight && (
                    <p className="text-xs text-gray-500">Weight: {productInfo.weight}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!manualBarcode.trim()}
              className="flex-1"
            >
              <Package className="h-4 w-4 mr-2" />
              Use This Barcode
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
